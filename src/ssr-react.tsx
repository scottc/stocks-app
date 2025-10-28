import {renderToReadableStream} from 'react-dom/server';
import App from './components/App';

const stream = await renderToReadableStream(<App />);

export default stream;