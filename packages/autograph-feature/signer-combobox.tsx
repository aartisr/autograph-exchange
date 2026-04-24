"use client";

import React from "react";
import type { AutographExchangeCopy, AutographProfile, AutographRole, RequestFormState, RoleOption } from "./types";
import { buildSignerSearchEntries, INPUT_CLASS, rankSignerSearchEntries, signerSearchLabel, titleCaseRole } from "./screen-utils";

export interface SignerComboboxProps {
  copy: AutographExchangeCopy;
  availableSigners: AutographProfile[];
  roleOptions: RoleOption[];
  requestForm: RequestFormState;
  setRequestForm: React.Dispatch<React.SetStateAction<RequestFormState>>;
  hintId: string;
}

function selectSigner(
  profile: AutographProfile,
  setRequestForm: React.Dispatch<React.SetStateAction<RequestFormState>>,
  setQuery: React.Dispatch<React.SetStateAction<string>>,
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
  roleLabels: Partial<Record<AutographRole, string>>,
) {
  setRequestForm((prev) => ({ ...prev, signerUserId: profile.userId }));
  setQuery(signerSearchLabel(profile, roleLabels));
  setIsOpen(false);
}

function buildRoleLabelMap(roleOptions: RoleOption[]): Partial<Record<AutographRole, string>> {
  return roleOptions.reduce<Partial<Record<AutographRole, string>>>((labels, option) => {
    labels[option.value] = option.label;
    return labels;
  }, {});
}

export function SignerCombobox({
  copy,
  availableSigners,
  roleOptions,
  requestForm,
  setRequestForm,
  hintId,
}: SignerComboboxProps) {
  const roleLabels = React.useMemo(() => buildRoleLabelMap(roleOptions), [roleOptions]);
  const signerById = React.useMemo(
    () => new Map(availableSigners.map((profile) => [profile.userId, profile])),
    [availableSigners],
  );
  const searchEntries = React.useMemo(() => buildSignerSearchEntries(availableSigners, roleLabels), [availableSigners, roleLabels]);
  const selectedSigner = requestForm.signerUserId ? signerById.get(requestForm.signerUserId) ?? null : null;
  const [query, setQuery] = React.useState(selectedSigner ? signerSearchLabel(selectedSigner, roleLabels) : "");
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const deferredQuery = React.useDeferredValue(query);
  const listId = React.useId();
  const inputId = React.useId();
  const blurTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!selectedSigner) {
      return;
    }

    setQuery(signerSearchLabel(selectedSigner, roleLabels));
  }, [roleLabels, selectedSigner]);

  React.useEffect(
    () => () => {
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    },
    [],
  );

  const filteredSigners = React.useMemo(() => rankSignerSearchEntries(searchEntries, deferredQuery).slice(0, 8), [
    searchEntries,
    deferredQuery,
  ]);

  const activeSigner = filteredSigners[activeIndex] ?? null;
  const activeOptionId = activeSigner ? `${listId}-${activeSigner.userId}` : undefined;

  React.useEffect(() => {
    setActiveIndex(0);
  }, [deferredQuery, isOpen]);

  return (
    <label className="autograph-field">
      <span className="app-form-label">{copy.whoShouldSign}</span>
      <div className="autograph-combobox">
        <input
          id={inputId}
          className={`${INPUT_CLASS} autograph-combobox-input`}
          value={query}
          placeholder={copy.signerSearchPlaceholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-describedby={hintId}
          aria-activedescendant={isOpen ? activeOptionId : undefined}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setIsOpen(true);
            setRequestForm((prev) => ({ ...prev, signerUserId: "" }));
          }}
          onKeyDown={(event) => {
            if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              event.preventDefault();
              setIsOpen(true);
              return;
            }

            if (event.key === "Escape") {
              setIsOpen(false);
              return;
            }

            if (!filteredSigners.length) {
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((prev) => (prev + 1) % filteredSigners.length);
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((prev) => (prev - 1 + filteredSigners.length) % filteredSigners.length);
            }

            if (event.key === "Home") {
              event.preventDefault();
              setActiveIndex(0);
            }

            if (event.key === "End") {
              event.preventDefault();
              setActiveIndex(filteredSigners.length - 1);
            }

            if (event.key === "Enter" && isOpen) {
              event.preventDefault();
              if (!activeSigner) {
                return;
              }

              selectSigner(activeSigner, setRequestForm, setQuery, setIsOpen, roleLabels);
            }
          }}
          onBlur={() => {
            blurTimeoutRef.current = window.setTimeout(() => {
              setIsOpen(false);
              if (!requestForm.signerUserId && selectedSigner) {
                setQuery(signerSearchLabel(selectedSigner, roleLabels));
              }
            }, 120);
          }}
        />

        {isOpen ? (
          <div id={listId} className="autograph-combobox-list" role="listbox" aria-labelledby={inputId}>
            {filteredSigners.length ? (
              filteredSigners.map((profile, index) => {
                const isSelected = requestForm.signerUserId === profile.userId;
                const isActive = activeIndex === index;

                return (
                  <button
                    key={profile.userId}
                    id={`${listId}-${profile.userId}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`autograph-combobox-option ${isSelected ? "is-selected" : ""} ${isActive ? "is-active" : ""}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectSigner(profile, setRequestForm, setQuery, setIsOpen, roleLabels);
                    }}
                  >
                    <span className="autograph-combobox-option-name">{profile.displayName}</span>
                    <span className="autograph-combobox-option-role">{roleLabels[profile.role] ?? titleCaseRole(profile.role)}</span>
                  </button>
                );
              })
            ) : (
              <p className="autograph-combobox-empty">{copy.signerSearchEmpty}</p>
            )}
          </div>
        ) : null}
      </div>
      <p id={hintId} className="autograph-field-hint">
        {copy.signerSearchHint}
      </p>
      {selectedSigner ? (
        <p className="autograph-combobox-selected">
          <span className="autograph-combobox-selected-label">{copy.signerSelectedLabel}</span>{" "}
          <strong>{signerSearchLabel(selectedSigner, roleLabels)}</strong>
        </p>
      ) : null}
    </label>
  );
}

export const MemoizedSignerCombobox = React.memo(SignerCombobox);
