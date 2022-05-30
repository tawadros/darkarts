import { Button } from '@mantine/core'
import { Connector, useConnect } from 'wagmi';

function Wallet(props: any) {
    // TODO: this component causes hydration error in dev, but not in start?

    const { connect, connectors, error, isConnecting, pendingConnector } = useConnect()

    return (
        <div>
            {connectors.map((connector : Connector) => (
                <Button
                    variant='light'
                    color='indigo'
                    disabled={!connector.ready}
                    key={connector.id}
                    onClick={() => connect(connector)}
                >
                {connector.name}
                {!connector.ready && ' (unsupported)'}
                {isConnecting &&
                    connector.id === pendingConnector?.id &&
                    ' (connecting)'}
                </Button>
            ))}

            {error && <div>{error.message}</div>}
        </div>
    )
}

export default Wallet