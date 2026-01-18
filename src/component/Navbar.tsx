"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Navbar = () => {
  return (
    <div className="sticky top-0 z-40 shadow-2xl border-b border-[#FFFFFF1A]">
      <nav className="flex justify-between items-center p-4 mx-auto container">
        <div className="font-semibold">Comfypay</div>

        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            if (!ready) return null;

            return (
              <div className="flex items-center gap-2">
                {!connected ? (
                  <button
                    onClick={openConnectModal}
                    className="rounded-lg bg-[#0D7534] px-4 py-2 text-white font-medium hover:bg-[#17D45C] transition"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <>
                    <button
                      onClick={openChainModal}
                      className="rounded-lg bg-gray-800 px-3 py-2 text-white text-sm"
                    >
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      className="rounded-lg bg-[#0D7534] px-4 py-2 text-white font-medium hover:bg-[#17D45C] transition"
                    >
                      {account.displayName}
                    </button>
                  </>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </nav>
    </div>
  );
};

export default Navbar;
