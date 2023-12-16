const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Ocorreu um erro durante a execução do comando!', ephemeral: true });
            }
        } else if (interaction.isButton() && interaction.customId === 'open_ticket') {
            const userTicket = await await db.get(`ticket_${interaction.user.id}`);

            if (userTicket && interaction.guild.channels.cache.has(userTicket)) {
                return await interaction.reply({ content: 'Você já tem um tíquete aberto. Conclua-o antes de abrir outro.', ephemeral: true });
            }

            const categoryChannel = interaction.guild.channels.cache.get("1060789666971910174"); // ID da categoria em que os tíquetes serão criados
            if (!categoryChannel || categoryChannel.type !== 'GUILD_CATEGORY') {
                return await interaction.reply('Erro: A categoria especificada não foi encontrada ou está incorreta.');
            }

            const ticketChannel = await interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
                type: 'GUILD_TEXT',
                parent: categoryChannel,
                topic: `Bilhete aberto por: ${interaction.user.tag}`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                    {
                        id: interaction.user.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
                    },
                    {
                        id: "1027347605354725396", // ID cargo número 1
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
                    },
                    {
                        id: "1014744779608838174", // ID cargo número 2
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
                    }
                ],
            });

            await db.set(`ticket_${interaction.user.id}`, ticketChannel.id);

            const embed = new MessageEmbed()
                .setDescription(`Bem-vindo ao seu tíquete, <@${interaction.user.id}>. Você está em um canal em contato com nossa equipe de suporte, a pessoa responsável pelo suporte o ajudará em breve.\n\n> \`1\` Não abra tíquetes de suporte para perguntas inúteis.\n> \`2\` Seguir todas as regras do servidor.`)
                .setColor(0x2b2d31)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

            const closeButton = new MessageButton()
                .setLabel('Fechar o tíquete')
                .setStyle('DANGER')
                .setCustomId('close_ticket');

            const addButton = new MessageButton()
                .setLabel('Adicionar um membro')
                .setStyle('SECONDARY')
                .setCustomId('add_member');

            const removeButton = new MessageButton()
                .setLabel('Remover um membro')
                .setStyle('SECONDARY')
                .setCustomId('remove_member');

            const claimButton = new MessageButton()
                .setLabel('Claim o tíquete')
                .setStyle('SUCCESS')
                .setCustomId('claim_ticket');

            const row = new MessageActionRow().addComponents([closeButton, addButton, removeButton, claimButton]);

            ticketChannel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: 'Seu tíquete foi criado com sucesso!', ephemeral: true });
        } else if (interaction.isButton()) {

            const r1 = "1027347605354725396"; // ID cargo número 1
            const r2 = "1014744779608838174"; // ID cargo número 2

            if (interaction.customId === 'close_ticket') {
                if (interaction.member.roles.cache.has(r1) || interaction.member.roles.cache.has(r2)) {
                    await interaction.reply('O tíquete será fechado em 5 segundos.');
                    setTimeout(() => {
                        interaction.channel.delete();
                        db.delete(`ticket_${interaction.user.id}`);
                    }, 5000);
                } else {
                    await interaction.reply({ content: "Você não tem as permissões necessárias para fechar este tíquete.", ephemeral: true });
                }
            } else if (interaction.customId === 'add_member' || interaction.customId === 'remove_member') {
                if (interaction.member.roles.cache.has(r1) || interaction.member.roles.cache.has(r2)) {
                    await interaction.reply({ content: 'Forneça o ID da pessoa a ser adicionada/removida.', ephemeral: true });
        
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });
        
                    collector.on('collect', async (message) => {
                        const memberId = message.content.trim();
        
                        const member = interaction.guild.members.cache.get(memberId);
                        if (!member) {
                            return message.reply('ID de membro inválido. Forneça um ID de membro válido.');
                        }
        
                        if (interaction.customId === 'add_member') {
                            await interaction.channel.permissionOverwrites.edit(memberId, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true, 'READ_MESSAGE_HISTORY': true });
                            return message.reply(`O membro <@${memberId}> foi adicionado ao tíquete.`);
                        } else if (interaction.customId === 'remove_member') {
                            await interaction.channel.permissionOverwrites.edit(memberId, { 'VIEW_CHANNEL': false });
                            return message.reply(`O membro <@${memberId}> foi removido do tíquete.`);
                        }
                    });
        
                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.followUp('Você demorou muito tempo para fornecer uma ID. Tente novamente.');
                        }
                    });
                } else {
                    await interaction.reply({ content: "Você não tem as permissões necessárias para adicionar/remover um membro.", ephemeral: true });
                }

            } else if (interaction.customId === 'claim_ticket') {
                const ticketChannel = interaction.channel;
            
                const isTicket = ticketChannel.name.startsWith('ticket-');
                if (!isTicket) {
                    return interaction.reply({ content: "Esta não é uma tíquete válida.", ephemeral: true });
                }
                
                const ticketOwner = await db.get(`ticketowner_${ticketChannel.id}`);
            
                if (ticketOwner === interaction.user.id) {
                    return interaction.reply({ content: "Você não pode reivindicar sua própria tíquete.", ephemeral: true });
                }
            
                const newName = `claim-${interaction.user.username}`;
                await ticketChannel.edit({ name: newName });
            
                await interaction.reply({ content: `Você reivindicou este tíquete!`, ephemeral: true });
            }
        }
    }
}