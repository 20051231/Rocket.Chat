import React, { useCallback, useState } from 'react';
import { Box, Button, Icon, Throbber } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { appButtonProps, appStatusSpanProps, handleAPIError, warnStatusChange } from './helpers';
import { Apps } from '../../../app/apps/client/orchestrator';
import { IframeModal } from './IframeModal';
import { CloudLoginModal } from './CloudLoginModal';

const installApp = async ({ id, name, version }) => {
	try {
		const { status } = await Apps.installApp(id, version);
		warnStatusChange(name, status);
	} catch (error) {
		handleAPIError(error);
	}
};

const actions = {
	purchase: installApp,
	install: installApp,
	update: async ({ id, name, version }) => {
		try {
			const { status } = await Apps.updateApp(id, version);
			warnStatusChange(name, status);
		} catch (error) {
			handleAPIError(error);
		}
	},
};

export const AppStatus = React.memo(({ app, setModal, isLoggedIn, ...props }) => {
	const t = useTranslation();
	const [loading, setLoading] = useState();

	const button = appButtonProps(app);
	const status = !button && appStatusSpanProps(app);

	const { id } = app;

	const confirmAction = () => {
		setModal(null);

		actions[button.action](app).then(() => {
			setLoading(false);
		});
	};

	const cancelAction = () => {
		setModal(null);
		setLoading(false);
	};

	const openModal = async () => {
		try {
			const data = await Apps.buildExternalUrl(app.id, app.purchaseType, false);

			setModal(() => <IframeModal url={data.url} cancel={cancelAction} confirm={confirmAction}/>);
		} catch (error) {
			handleAPIError(error);
		}
	};

	const handleClick = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		if (isLoggedIn) {
			setLoading(true);

			button.action === 'purchase' ? openModal() : confirmAction();
			return;
		}
		setModal(<CloudLoginModal cancel={() => setModal(null)} />);
	}, [id, isLoggedIn, button && button.action]);

	return <Box {...props}>
		{button && <Button primary disabled={loading} onClick={handleClick}>
			{loading && <Throbber />}
			{!loading && button.icon && <Icon name={button.icon} />}
			{!loading && t(button.label)}
		</Button>}
		{status && <Box color={status.label === 'Disabled' ? 'warning' : 'hint'} display='flex' alignItems='center'>
			<Icon size='x20' name={status.icon} mie='x4'/>
			{t(status.label)}
		</Box>}
	</Box>;
});
