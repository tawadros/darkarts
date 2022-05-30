import { Connector, useConnect } from "wagmi";
import { Button } from "@mantine/core";
import { showNotification } from "@mantine/notifications";

function Wallet(props: any) {
	const errorHandler = (error: Error) => showNotification({
		title: "Error when Connecting Wallet",
		message: error.message,
		color: "red",
	});

	const { connect, connectors, isConnecting, pendingConnector } = useConnect({
		onError: errorHandler,
	});

	return (
		<div>
			{connectors.map((connector: Connector) => (
				<Button
					variant="light"
					color="indigo"
					key={connector.id}
					onClick={() => connect(connector)}
					disabled={!connector.ready}
				>
					{props.account
						? props.account.address.substring(0, 8) + "..."
						: connector.name}
					{!connector.ready && " (unsupported)"}
					{isConnecting &&
						connector.id === pendingConnector?.id &&
						" (connecting)"}
				</Button>
			))}
		</div>
	);
}

export default Wallet;
