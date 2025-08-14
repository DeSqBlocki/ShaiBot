module.exports = {
    slash: true,
    description: 'waa! at someone',
    category: 'Misc',
    cooldown: '3h',
    options: [
        {
            name: 'victim',
            description: 'pick anyone >:D',
            required: true,
            type: 9,
        },
    ],
    callback: async ({ interaction, args, client }) => {
        var reply = 'waa!'
        
        const member = client.users.cache.get(args[0]);
        if(args[0]){
            reply+= ` <@${member.id}>`
        }
        interaction.reply({
            content: reply,
            tts: true
          })
    }
}