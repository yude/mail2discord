const PostalMime = require("postal-mime");

async function streamToArrayBuffer(stream, streamSize) {
    let result = new Uint8Array(streamSize);
    let bytesRead = 0;
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      result.set(value, bytesRead);
      bytesRead += value.length;
    }
    return result;
}

export default {
	async email(message, env, ctx) {
        const rawEmail = await streamToArrayBuffer(message.raw, message.rawSize);
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
					email: "discord+noreply@yude.jp",
					name: 'E-mail to Discord proxy',
				},
				subject: 'Your mail has been successfully proxied to Discord.',
				content: [
					{
						type: 'text/plain',
						value: `🐣🐣🐣`,
					},
				],
			}),
		})

		const resp_mail = await fetch(mail_send_request);
		const resp_mail_text = await resp_mail.text();

		const { value: messageRaw } = await message.raw.getReader().read()
		const messageRawJSON = new TextDecoder().decode(messageRaw)
		console.log("Received message (Stage: E-mail reply)", messageRawJSON)
		console.log("Response (Stage: E-mail reply)", resp.status + " " + resp.statusText + " " + resp_mail_text)
	},
}
