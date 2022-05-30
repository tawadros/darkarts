import React from "react";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";

import { AppShell, Navbar, Header, Group, Text } from "@mantine/core";

function DarkartsAppShell(props: any) {
	const { data: account } = useAccount();

	const Wallet = dynamic(() => import("./Wallet"));

	const head = (
		<Header height={60} p="xs">
			<Group sx={{ height: "100%" }} px={20} position="apart">
				<Text>Darkarts</Text>
				<Wallet account={account} />
			</Group>
		</Header>
	);

	const nav = (
		<Navbar width={{ base: 300 }} p="xs">
			<Navbar.Section>
				<Text>Your Vault</Text>
			</Navbar.Section>
			<Navbar.Section>
				<Text>Deposit</Text>
			</Navbar.Section>
			<Navbar.Section>
				<Text>Send</Text>
			</Navbar.Section>
			<Navbar.Section>
				<Text>Withdraw</Text>
			</Navbar.Section>
		</Navbar>
	);

	const styleFunc = (theme: any) => ({
		main: {
			backgroundColor:
				theme.colorScheme === "dark"
					? theme.colors.dark[8]
					: theme.colors.gray[0],
		},
	});

	return (
		<AppShell
			styles={styleFunc}
			padding="md"
			navbar={nav}
			navbarOffsetBreakpoint="sm"
			header={head}
		>
			{/* ugly method to pass props to children, since we can't use account in _app */}
			{React.Children.map(props.children, (child: any) =>
				React.cloneElement(child, { account })
			)}
		</AppShell>
	);
}

export default DarkartsAppShell;
