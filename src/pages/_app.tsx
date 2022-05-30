import { MantineProvider } from "@mantine/core";
import type { AppProps } from "next/app";
import { Suspense } from "react";

import { WagmiConfig, createClient } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

import DarkartsAppShell from "../components/AppShell";

function MyApp({ Component, pageProps }: AppProps) {
	const client = createClient({
		connectors: [new MetaMaskConnector()],
	});

	return (
		<Suspense>
			<WagmiConfig client={client}>
				<MantineProvider theme={{ colorScheme: "light" }}>
					<DarkartsAppShell>
						<Component ta="ye" {...pageProps} />
					</DarkartsAppShell>
				</MantineProvider>
			</WagmiConfig>
		</Suspense>
	);
}

export default MyApp;
