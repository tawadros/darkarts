import { Suspense } from "react";
import type { AppProps } from "next/app";
import { WagmiConfig, createClient } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";

import DarkartsAppShell from "../components/AppShell";

function MyApp({ Component, pageProps }: AppProps) {
	const client = createClient({
		connectors: [new MetaMaskConnector()],
	});

	return (
		<Suspense>
			<WagmiConfig client={client}>
				<MantineProvider theme={{ colorScheme: "light" }}>
					<NotificationsProvider>
						<DarkartsAppShell>
							<Component ta="ye" {...pageProps} />
						</DarkartsAppShell>
					</NotificationsProvider>
				</MantineProvider>
			</WagmiConfig>
		</Suspense>
	);
}

export default MyApp;
