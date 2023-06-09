const PostalMime = require("postal-mime");


export default {
	async email(message, env, ctx) {
			const resEmail = new Response(message.raw);
			const rawEmail = await resEmail.text()
			console.log("Response (Stage: E-mail parse)", resEmail.status + " " + resEmail.statusText + " " + rawEmail)
			const parser = new PostalMime.default();
			const parsedEmail = await parser.parse(rawEmail);

			const discord_send_request = new Request(env.WEBHOOK_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username: message.from,
					content: "**" + parsedEmail.subject + "**\n```" + parsedEmail.text + "\n```"
				}),
			})

			const discord_resp = await fetch(discord_send_request);
			const discord_resptext = await discord_resp.text();
			console.log("Response (Stage: Discord)", discord_resptext)
			
			const mail_send_request = new Request('https://api.mailchannels.net/tx/v1/send', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					personalizations: [
						{
							to: [{ email: `${message.from}`, name: `${message.from}` }],
						},
					],
					from: {
						email: "spam+noreply@yude.jp",
						name: '漏れ',
					},
					subject: 'Your mail has been successfully proxied to Discord.',
					content: [
						{
							type: 'text/plain',
							value: `あなたが送ってくれたメールは、Discord のテキストチャンネルに転送されました。\nお手紙どうもありがとう！`,
						},
					],
				}),
			})

			const resp_mail = await fetch(mail_send_request);
			const resp_mail_text = await resp_mail.text();

			console.log("Response (Stage: E-mail reply)", resp_mail.status + " " + resp_mail.statusText + " " + resp_mail_text)
	}
}
