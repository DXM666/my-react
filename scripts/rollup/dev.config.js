import reactDomConfig from './react-dom.config';
import reactConfig from './react.config';
import reactNoopRendererConfig from './react-noop-renderer.config';
export default () => {
	return [...reactConfig, ...reactDomConfig, ...reactNoopRendererConfig];
};
