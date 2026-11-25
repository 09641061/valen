"use client";

import { useRef, useState, useTransition } from "react";
import { loadCustomerConversationsAction } from "../actions";
import type { ConversationDto, CustomerDto } from "../schemas";

export function useCustomerProfileState(selectedCustomer: CustomerDto | null) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileConversations, setProfileConversations] = useState<
    ConversationDto[]
  >([]);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [isLoadingProfile, startProfileTransition] = useTransition();
  const profileReqRef = useRef(0);

  function handleOpenProfile() {
    if (!selectedCustomer) return;
    const customerId = selectedCustomer.id;
    const reqId = ++profileReqRef.current;
    setProfileOpen(true);
    setProfileConversations([]);
    setProfileLoadError(null);
    startProfileTransition(async () => {
      const result = await loadCustomerConversationsAction(customerId);
      if (profileReqRef.current !== reqId) return;
      if (!result.ok) {
        setProfileLoadError(result.message);
        setProfileConversations([]);
        return;
      }
      setProfileConversations(result.data);
    });
  }

  function handleProfileOpenChange(open: boolean) {
    if (!open) {
      profileReqRef.current += 1;
    }
    setProfileOpen(open);
  }

  return {
    profileOpen,
    profileConversations,
    profileLoadError,
    isLoadingProfile,
    handleOpenProfile,
    handleProfileOpenChange,
  };
}
