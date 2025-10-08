'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      message_type: {
        type: Sequelize.ENUM('text', 'image', 'file', 'system'),
        allowNull: false,
        defaultValue: 'text'
      },
      attachment_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL for image or file attachments'
      },
      reply_to_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Reference to message being replied to'
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance optimization
    await queryInterface.addIndex('messages', ['conversation_id', 'created_at'], {
      name: 'idx_messages_conversation_created'
    });

    await queryInterface.addIndex('messages', ['sender_id'], {
      name: 'idx_messages_sender_id'
    });

    await queryInterface.addIndex('messages', ['reply_to_id'], {
      name: 'idx_messages_reply_to'
    });

    await queryInterface.addIndex('messages', ['conversation_id', 'message_type'], {
      name: 'idx_messages_conversation_type'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('messages');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_messages_message_type";');
  }
};
