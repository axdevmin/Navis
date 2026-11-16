import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useQuery, useSubscription } from "relay-hooks";
import { ConnectionHandler } from "relay-runtime";
import { ChatUserList } from "./chat-user-list";
import { ChatMessages } from "./chat-messages";
import { ChatSettings } from "./chat-settings";
import { chatSubscription } from "./__generated__/chatSubscription.graphql";
import { chatQuery } from "./__generated__/chatQuery.graphql";
import * as Button from "../button";
import * as HorizontalNavigation from "../horizontal-navigation";
import * as Icon from "../feather-icons";
import useSound from "use-sound";
import diceRollSound from "./dice-roll.mp3";
import notificationSound from "./notification.mp3";
import styled from "@emotion/styled/macro";
import { ChatTextArea } from "./chat-textarea";
import { chatUserUpdateSubscription } from "./__generated__/chatUserUpdateSubscription.graphql";
import { ChatOnlineUserIndicator } from "./chat-online-user-indicator";
import { isAbstractGraphQLMemberType } from "../relay-utilities";
import { chatMessageSoundSubscription } from "./__generated__/chatMessageSoundSubscription.graphql";
import { useSoundSettings } from "../sound-settings";
import { useStaticRef } from "../hooks/use-static-ref";
import { ds } from "../design-system";

const AppSubscription = graphql`
  subscription chatSubscription {
    chatMessagesAdded {
      messages {
        id
        ...chatMessage_message
      }
    }
  }
`;

const ChatMessageSoundSubscription = graphql`
  subscription chatMessageSoundSubscription {
    chatMessagesAdded {
      messages {
        __typename
        ... on TextChatMessage {
          containsDiceRoll
        }
      }
    }
  }
`;

const UserUpdateSubscription = graphql`
  subscription chatUserUpdateSubscription {
    userUpdate {
      ... on UserRemoveUpdate {
        __typename
        userId
        usersCount
      }
      ... on UserAddUpdate {
        __typename
        user {
          id
          name
        }
        usersCount
      }
      ... on UserChangeUpdate {
        __typename
        user {
          id
          name
        }
      }
    }
  }
`;

const ChatQuery = graphql`
  query chatQuery {
    ...chatMessages_chat
    # TODO: move this stuff to own pagination/fragment container.
    ...chatUserList_data
    ...chatOnlineUserIndicator_data
    me {
      id
      ...chatSettings_data
    }
  }
`;

const ChatWindow = styled.div`
  background: ${ds.colors.surface};
  font-size: 13px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px 12px 0;
  gap: 8px;
  border-bottom: 1px solid ${ds.colors.border};
  flex-shrink: 0;
`;

const ChatHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${ds.colors.textSecondary};
  font-family: ${ds.font.sans};
`;

const ChatBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  padding: 0;
`;

const ChatFooter = styled.div`
  border-top: 1px solid ${ds.colors.border};
  padding: 10px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DiceButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: none;
  color: ${ds.colors.textMuted};
  font-size: 11px;
  font-family: ${ds.font.sans};
  font-weight: 500;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: ${ds.radii.sm};
  transition: all ${ds.transitions.fast};
  letter-spacing: 0.02em;

  svg {
    stroke: ${ds.colors.textMuted};
  }

  &:hover {
    color: ${ds.colors.accent};
    background: ${ds.colors.accentMuted};
    svg {
      stroke: ${ds.colors.accent};
    }
  }
`;

export const useChatSoundsAndUnreadCount = (
  chatState: "hidden" | "show",
  isLoggedIn: boolean
) => {
  const [hasUnreadMessages, setHasUnreadMessages] = React.useState(false);
  const [playDiceRollSound] = useSound(diceRollSound, {
    volume: 0.5,
  });
  const [playNotificationSound] = useSound(notificationSound, {
    volume: 0.5,
  });
  const soundSettings = useSoundSettings();

  const refs = React.useRef({
    playDiceRollSound,
    playNotificationSound,
    chatState,
    soundSettings,
  });

  React.useEffect(() => {
    refs.current = {
      playDiceRollSound,
      playNotificationSound,
      chatState,
      soundSettings,
    };
  });

  useSubscription<chatMessageSoundSubscription>(
    useStaticRef(() => ({
      subscription: ChatMessageSoundSubscription,
      variables: {},
      onNext: (data) => {
        if (data) {
          let mode: "dice-roll-message" | "text-message" = "text-message";

          if (
            data.chatMessagesAdded.messages.some(
              (message) => message.containsDiceRoll === true
            )
          ) {
            mode = "dice-roll-message";
          }

          if (
            mode === "text-message" &&
            refs.current.soundSettings.value === "all"
          ) {
            refs.current.playNotificationSound();
          } else if (
            mode === "dice-roll-message" &&
            refs.current.soundSettings.value !== "none"
          ) {
            refs.current.playDiceRollSound();
          }

          if (refs.current.chatState === "hidden") {
            setHasUnreadMessages(true);
          }
        }
      },
    })),
    { skip: isLoggedIn === false }
  );

  return [hasUnreadMessages, () => setHasUnreadMessages(false)] as [
    boolean,
    () => void
  ];
};

export const Chat: React.FC<{
  toggleShowDiceRollNotes: () => void;
}> = React.memo(({ toggleShowDiceRollNotes }) => {
  const [mode, setMode] = React.useState<"chat" | "user" | "settings">("chat");

  useSubscription<chatSubscription>(
    useStaticRef(() => ({
      subscription: AppSubscription,
      variables: {},
      updater: (store) => {
        const chat = ConnectionHandler.getConnection(
          store.getRoot(),
          "chatMessages_chat"
        );

        const records = store
          .getRootField("chatMessagesAdded")
          ?.getLinkedRecords("messages");
        if (!chat || !records) return;

        for (const chatMessage of records) {
          const edge = ConnectionHandler.createEdge(
            store,
            chat,
            chatMessage,
            "ChatMessage"
          );
          ConnectionHandler.insertEdgeAfter(chat, edge);
        }
      },
    }))
  );

  useSubscription<chatUserUpdateSubscription>(
    useStaticRef(() => ({
      subscription: UserUpdateSubscription,
      variables: {},
      updater: (store) => {
        const users = ConnectionHandler.getConnection(
          store.getRoot(),
          "chatUserList_users"
        );

        const updateRecord = store.getRootField("userUpdate");
        const root = store.getRoot();

        if (!users || !updateRecord) return;

        if (isAbstractGraphQLMemberType(updateRecord, "UserAddUpdate")) {
          const edge = ConnectionHandler.createEdge(
            store,
            users,
            updateRecord.getLinkedRecord("user"),
            "User"
          );
          ConnectionHandler.insertEdgeAfter(users, edge);
          root.setValue(updateRecord.getValue("usersCount"), "usersCount");
        } else if (
          isAbstractGraphQLMemberType(updateRecord, "UserRemoveUpdate")
        ) {
          const userId = updateRecord.getValue("userId");
          ConnectionHandler.deleteNode(users, userId);
          root.setValue(updateRecord.getValue("usersCount"), "usersCount");
        }
      },
    }))
  );

  const retryRef = React.useRef<null | (() => void)>(null);
  const { error, data, retry } = useQuery<chatQuery>(ChatQuery);

  if (error) {
    return null;
  }
  if (!data) {
    return null;
  }

  retryRef.current = retry;

  return (
    <ChatWindow
      onContextMenu={(ev) => {
        ev.stopPropagation();
      }}
    >
      <ChatHeader>
        <ChatHeaderTitle>
          <ChatTitle>Canal de communication</ChatTitle>
        </ChatHeaderTitle>
        <HorizontalNavigation.Group>
          <HorizontalNavigation.Button
            small
            isActive={mode === "chat"}
            fullWidth
            onClick={() => setMode("chat")}
          >
            <Icon.MessageCircle boxSize="12px" />
            <span>Chat</span>
          </HorizontalNavigation.Button>
          <HorizontalNavigation.Button
            small
            isActive={mode === "user"}
            fullWidth
            onClick={() => setMode("user")}
          >
            <Icon.Users boxSize="12px" />
            <span>
              Joueurs (<ChatOnlineUserIndicator data={data} />)
            </span>
          </HorizontalNavigation.Button>
          <HorizontalNavigation.Button
            small
            isActive={mode === "settings"}
            fullWidth
            onClick={() => setMode("settings")}
          >
            <Icon.Settings boxSize="12px" />
            <span>Config</span>
          </HorizontalNavigation.Button>
        </HorizontalNavigation.Group>
      </ChatHeader>

      {mode === "chat" ? (
        <>
          <ChatBody>
            <ChatMessages chat={data} />
          </ChatBody>
          <ChatFooter>
            <ChatTextArea />
            <DiceButton onClick={toggleShowDiceRollNotes}>
              <Icon.Dice boxSize="12px" />
              <span>Notes de dés</span>
            </DiceButton>
          </ChatFooter>
        </>
      ) : mode === "user" ? (
        <ChatBody style={{ padding: "12px" }}>
          <ChatUserList data={data} />
        </ChatBody>
      ) : mode === "settings" ? (
        <ChatBody style={{ padding: "12px" }}>
          <ChatSettings data={data.me} />
        </ChatBody>
      ) : null}
    </ChatWindow>
  );
});
