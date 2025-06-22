"use client";

import React from "react";
import {
  isConnected,
  getNetwork,
  signTransaction,
  requestAccess,
} from "@stellar/freighter-api";

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  network: string | null;
  isLoading: boolean;
  error: string | null;
}

export class FreighterWalletService {
  private listeners: Array<(state: WalletState) => void> = [];
  private state: WalletState = {
    isConnected: false,
    publicKey: null,
    network: null,
    isLoading: false,
    error: null,
  };

  constructor() {
    if (typeof window !== "undefined") {
      this.checkConnection();
    }
  }

  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private updateState(updates: Partial<WalletState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  async checkConnection(): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      if (await isConnected()) {
        const access = await requestAccess();
        const network = await getNetwork();
        this.updateState({
          isConnected: true,
          publicKey: access.address,
          network: network.network,
          isLoading: false,
        });
      } else {
        this.updateState({ isConnected: false, isLoading: false });
      }
    } catch (error) {
      this.updateState({
        error: "Error checking Freighter connection.",
        isLoading: false,
      });
      console.error(error);
    }
  }

  async connect(): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const access = await requestAccess();
      const network = await getNetwork();
      this.updateState({
        isConnected: true,
        publicKey: access.address,
        network: network.network,
        isLoading: false,
      });
    } catch (error) {
      this.updateState({
        error: "User declined connection request or Freighter not available.",
        isLoading: false,
      });
      console.error(error);
    }
  }

  disconnect(): void {
    this.updateState({
      isConnected: false,
      publicKey: null,
      network: null,
      error: null,
    });
  }

  async signTransaction(xdr: string): Promise<string> {
    if (
      !this.state.isConnected ||
      !this.state.publicKey ||
      !this.state.network
    ) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await signTransaction(xdr, {
        networkPassphrase:
          this.state.network === "TESTNET"
            ? "Test SDF Network ; September 2015"
            : "Public Global Stellar Network ; September 2015",
      });

      // The return type is an object, but the type definitions seem to be incorrect.
      // Using `any` to bypass the linter error.
      const resultObj = result as any;

      if (resultObj.error) {
        throw new Error(resultObj.error);
      }

      if (!resultObj.signedTxXdr) {
        throw new Error("Signing failed: No signed XDR returned.");
      }

      return resultObj.signedTxXdr;
    } catch (error: any) {
      console.error("Error signing transaction:", error);
      const errorMessage = error.message || "Failed to sign transaction";
      throw new Error(errorMessage);
    }
  }

  getState(): WalletState {
    return { ...this.state };
  }

  getFormattedAddress(): string {
    if (!this.state.publicKey) return "";
    const key = this.state.publicKey;
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }

  isTestnet(): boolean {
    return this.state.network === "TESTNET";
  }

  getNetworkName(): string {
    return this.state.network || "Unknown";
  }
}

export const freighterWalletService = new FreighterWalletService();

export function useFreighterWallet() {
  const [state, setState] = React.useState<WalletState>(
    freighterWalletService.getState()
  );

  React.useEffect(() => {
    const unsubscribe = freighterWalletService.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    connect: () => freighterWalletService.connect(),
    disconnect: () => freighterWalletService.disconnect(),
    signTransaction: (xdr: string) =>
      freighterWalletService.signTransaction(xdr),
    getFormattedAddress: () => freighterWalletService.getFormattedAddress(),
    isTestnet: () => freighterWalletService.isTestnet(),
    getNetworkName: () => freighterWalletService.getNetworkName(),
    checkConnection: () => freighterWalletService.checkConnection(),
  };
}
