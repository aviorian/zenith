default: build

all: build

test: build
	cargo test

build:
	cargo rustc -- -C opt-level=z -C link-arg=-s

fmt:
	cargo fmt --all

clean:
	cargo clean 