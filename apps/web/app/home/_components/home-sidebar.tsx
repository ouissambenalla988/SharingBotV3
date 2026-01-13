'use client';

import { useState, useEffect } from 'react';
import type { JwtPayload } from '@supabase/supabase-js';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarNavigation,
} from '@kit/ui/shadcn-sidebar';
import { Button } from '~/components/ui/button';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { navigationConfig } from '~/config/navigation.config';
import { Tables } from '~/lib/database.types';
import { getConversations, createConversation } from '../../lib/supabase/conversations';
import type { Conversation } from '../../types/database.types';

// Grouper les conversations par période
function groupConversationsByTime(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups = {
    today: [] as Conversation[],
    yesterday: [] as Conversation[],
    sevenDays: [] as Conversation[],
    thirtyDays: [] as Conversation[],
    older: [] as Conversation[],
  };

  conversations.forEach((conv) => {
    const convDate = new Date(conv.created_at);
    
    if (convDate >= today) {
      groups.today.push(conv);
    } else if (convDate >= yesterday) {
      groups.yesterday.push(conv);
    } else if (convDate >= sevenDaysAgo) {
      groups.sevenDays.push(conv);
    } else if (convDate >= thirtyDaysAgo) {
      groups.thirtyDays.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
}

export function HomeSidebar(props: {
  account?: Tables<'accounts'>;
  user: JwtPayload;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const userId = props.user?.sub;

  // Charger les conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!userId) return;
      
      try {
        const convs = await getConversations(userId);
        setConversations(convs);
        
        // Détecter la conversation active depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const convIdFromUrl = urlParams.get('conv');
        if (convIdFromUrl) {
          setActiveConvId(convIdFromUrl);
        } else if (convs.length > 0) {
          setActiveConvId(convs[0]!.id);
        }
      } catch (error) {
        console.error('Erreur chargement conversations:', error);
      } finally {
        setIsLoadingConvs(false);
      }
    };

    loadConversations();
  }, [userId]);

  // Créer une nouvelle conversation
  const handleNewConversation = async () => {
    if (!userId) return;

    try {
      const newConv = await createConversation(
        userId,
        `Chat ${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`
      );
      
      if (newConv) {
        setConversations([newConv, ...conversations]);
        // Rediriger vers la page de chat avec cette conversation
        window.location.href = `/home?conv=${newConv.id}`;
      }
    } catch (error) {
      console.error('Erreur création conversation:', error);
    }
  };

  // Sélectionner une conversation
  const handleSelectConversation = (convId: string) => {
    window.location.href = `/home?conv=${convId}`;
  };

  const groupedConversations = groupConversationsByTime(conversations);

  const ConversationItem = ({ conv }: { conv: Conversation }) => (
    <button
      key={conv.id}
      onClick={() => handleSelectConversation(conv.id)}
      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-all group ${
        conv.id === activeConvId
          ? 'bg-gray-100 dark:bg-gray-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
      title={conv.title}
    >
      <MessageSquare className={`h-4 w-4 flex-shrink-0 ${
        conv.id === activeConvId
          ? 'text-gray-700 dark:text-gray-300'
          : 'text-gray-400'
      }`} />
      <span className={`flex-1 truncate text-sm group-data-[collapsible=icon]:hidden ${
        conv.id === activeConvId
          ? 'text-gray-900 dark:text-gray-100 font-medium'
          : 'text-gray-600 dark:text-gray-400'
      }`}>
        {conv.title}
      </span>
    </button>
  );

  const TimeSection = ({ title, conversations }: { title: string; conversations: Conversation[] }) => {
    if (conversations.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h3 className="px-3 mb-2 text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
          {title}
        </h3>
        <div className="space-y-0.5">
          {conversations.map((conv) => (
            <ConversationItem key={conv.id} conv={conv} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Sidebar collapsible={'icon'} className="w-[280px]">
      <SidebarHeader className={'h-14 justify-center border-b border-gray-200 dark:border-gray-800'}>
        <div className={'flex items-center justify-center px-3'}>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-data-[collapsible=icon]:hidden">
            SharingBot
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* Bouton Nouvelle Conversation - Style DeepSeek */}
        <Button
          onClick={handleNewConversation}
          className="w-full mb-6 justify-center gap-2 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border-0"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden font-medium">New chat</span>
        </Button>

        {/* Liste des conversations groupées par temps */}
        {isLoadingConvs ? (
          <div className="px-3 py-8 text-xs text-gray-400 text-center group-data-[collapsible=icon]:hidden">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-8 text-xs text-gray-400 text-center group-data-[collapsible=icon]:hidden">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-0 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {groupedConversations.today.length > 0 && (
              <TimeSection title="Today" conversations={groupedConversations.today} />
            )}
            {groupedConversations.yesterday.length > 0 && (
              <TimeSection title="Yesterday" conversations={groupedConversations.yesterday} />
            )}
            {groupedConversations.sevenDays.length > 0 && (
              <TimeSection title="7 Days" conversations={groupedConversations.sevenDays} />
            )}
            {groupedConversations.thirtyDays.length > 0 && (
              <TimeSection title="30 Days" conversations={groupedConversations.thirtyDays} />
            )}
            {groupedConversations.older.length > 0 && (
              <TimeSection title="Older" conversations={groupedConversations.older} />
            )}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-800">
        <ProfileAccountDropdownContainer
          user={props.user}
          account={props.account}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
