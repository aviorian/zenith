import {
  TransactionBuilder,
  Networks,
  Contract,
  TimeoutInfinite,
  rpc,
  nativeToScVal,
  Address,
  xdr,
} from "@stellar/stellar-sdk";
import { freighterWalletService } from "./wallet";

// TODO: Replace with actual deployed contract IDs
const MARKETPLACE_CONTRACT_ID =
  "CDLZF2PZ644YFFC6E57S3Y4A3KL4T2Q6J2X6YJ5Z3Z6Z6Z6Z6Z6Z6Z6Z";
const LIQUIDITY_POOL_CONTRACT_ID =
  "CCWJ7T7Q7JU4K7A7Q5J5J6K7K7K7K7K7K7K7K7K7K7K7K7K7K7K7K7K7"; // Different placeholder
const INVOICE_NFT_CONTRACT_ID =
  "CAWJ7T7Q7JU4K7A7Q5J5J6K7K7K7K7K7K7K7K7K7K7K7K7K7K7K7K7K7"; // Different placeholder

const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org/";
const server = new rpc.Server(SOROBAN_RPC_URL, {
  allowHttp: true,
});
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/**
 * Converts a string representation of a number to stroops (BigInt).
 * @param amount The string amount.
 * @returns The amount in stroops as a BigInt.
 */
function toStroops(amount: string): bigint {
  const [integer, fractional = ""] = amount.split(".");
  if (fractional.length > 7) {
    throw new Error("Amount has too many decimal places.");
  }
  const paddedFractional = fractional.padEnd(7, "0");
  return BigInt(integer + paddedFractional);
}

export interface InvoiceFormData {
  amount: string;
  deadline: string; // date string
  customerName: string;
  description: string;
  customerEmail: string;
}

export async function createInvoice(invoiceData: InvoiceFormData) {
  const { publicKey } = freighterWalletService.getState();
  if (!publicKey) {
    throw new Error("Wallet not connected");
  }

  const contract = new Contract(MARKETPLACE_CONTRACT_ID);
  const source = await server.getAccount(publicKey);

  const deadlineTimestamp = BigInt(
    Math.floor(new Date(invoiceData.deadline).getTime() / 1000)
  );

  const tx = new TransactionBuilder(source, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "create_invoice", // Guessed function name from PDR
        new Address(publicKey).toScVal(),
        nativeToScVal(toStroops(invoiceData.amount), { type: "i128" }),
        nativeToScVal(deadlineTimestamp, { type: "u64" }),
        nativeToScVal(invoiceData.customerName, { type: "string" }),
        nativeToScVal(invoiceData.description, { type: "string" }),
        nativeToScVal(invoiceData.customerEmail, { type: "string" })
      )
    )
    .setTimeout(TimeoutInfinite)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const signedTxXdr = await freighterWalletService.signTransaction(
    preparedTx.toXDR()
  );

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const txResponse = await server.sendTransaction(signedTx);

  return txResponse;
}

export interface StakeInfo {
  amount: string;
  durationDays: number;
}

export async function stakeUsdc(stakeInfo: StakeInfo) {
  const { publicKey } = freighterWalletService.getState();
  if (!publicKey) {
    throw new Error("Wallet not connected");
  }

  const contract = new Contract(LIQUIDITY_POOL_CONTRACT_ID);
  const source = await server.getAccount(publicKey);

  const tx = new TransactionBuilder(source, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "stake",
        new Address(publicKey).toScVal(),
        nativeToScVal(toStroops(stakeInfo.amount), { type: "i128" }),
        nativeToScVal(BigInt(stakeInfo.durationDays), { type: "u64" })
      )
    )
    .setTimeout(TimeoutInfinite)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  const signedTxXdr = await freighterWalletService.signTransaction(
    preparedTx.toXDR()
  );

  const txResponse = await server.sendTransaction(signedTxXdr);

  return txResponse;
}
