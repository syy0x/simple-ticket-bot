const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Configurar o sistema de tíquetes.'),
    async execute(interaction) {
        const authorizedIDs = ["1161617086678835213", "1064407279903985794"];
        const userId = interaction.user.id;

        if (!authorizedIDs.includes(userId)) {
            return interaction.reply({ content: "> \`❌\` Você não tem as permissões necessárias para usar esse comando.", ephemeral: true });
        }

        const embed = new MessageEmbed()
            .setTitle('SUPORTE - AIMXITERS')
            .setDescription('Convidamos você a clicar no botão abaixo para iniciar Suporte. 📩\n\n🚫 Qualquer abuso do sistema de tíquetes estará sujeito a sanções.')
            .setColor(0x2b2d31)
            .setThumbnail('https://i.ibb.co/44jsnq9/Group-1.png')
            .setImage('https://i.ibb.co/9bJNg16/Group-2.png')
            .setTimestamp()
            .setFooter('Aimxiters Suporte');

        const openTicketButton = new MessageButton()
            .setLabel('iniciar Suporte')
            .setEmoji('📩')
            .setStyle('SECONDARY')
            .setCustomId('open_ticket');

        const row = new MessageActionRow().addComponents(openTicketButton);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '> \`✅\` O sistema de tíquetes foi configurado.', ephemeral: true });
    }
};
