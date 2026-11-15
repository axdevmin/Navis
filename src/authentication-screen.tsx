import * as React from "react";
import styled from "@emotion/styled/macro";
import { BackgroundImageContainer } from "./background-image-container";
import { BrandLogoText } from "./brand-logo-text";
import { ds } from "./design-system";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InputField = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid ${ds.colors.borderStrong};
  border-radius: ${ds.radii.md};
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 14px;
  outline: none;
  transition: all ${ds.transitions.fast};

  &::placeholder {
    color: ${ds.colors.textMuted};
  }

  &:focus {
    border-color: ${ds.colors.accent};
    background: rgba(227, 181, 101, 0.06);
    box-shadow: 0 0 0 3px rgba(227, 181, 101, 0.12);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  height: 44px;
  background: ${ds.colors.accent};
  color: ${ds.colors.onAccent};
  border: none;
  border-radius: ${ds.radii.md};
  font-family: ${ds.font.sans};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all ${ds.transitions.fast};
  letter-spacing: 0.01em;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(227, 181, 101, 0.2);

  &:hover {
    background: ${ds.colors.accentHover};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(227, 181, 101, 0.35),
      0 0 0 1px rgba(227, 181, 101, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ErrorBox = styled.div`
  background: ${ds.colors.dangerMuted};
  border: 1px solid rgba(229, 72, 77, 0.3);
  border-radius: ${ds.radii.md};
  padding: 12px 16px;
  color: #f87171;
  font-size: 13px;
  font-family: ${ds.font.sans};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SwitchLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 24px;
  color: ${ds.colors.textMuted};
  font-family: ${ds.font.sans};
  font-size: 12px;
  text-decoration: none;
  transition: color ${ds.transitions.fast};
  letter-spacing: 0.02em;

  &:hover {
    color: ${ds.colors.accent};
  }
`;

const RoleBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${ds.colors.accentMuted};
  border: 1px solid ${ds.colors.accentBorder};
  border-radius: ${ds.radii.full};
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  color: ${ds.colors.accent};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: ${ds.font.sans};
  margin: 0 auto 24px;
`;

const BadgeWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

export const AuthenticationScreen: React.FC<{
  onAuthenticate: (password: string) => void;
  requiredRole: "DM" | "PC";
  fetch: typeof fetch;
}> = ({ onAuthenticate, requiredRole = "DM", fetch }) => {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <BackgroundImageContainer>
      <BrandLogoText />
      <BadgeWrapper>
        <RoleBadge>
          {requiredRole === "DM" ? "Maître du Jeu" : "Joueur"}
        </RoleBadge>
      </BadgeWrapper>
      <Form
        onSubmit={async (ev) => {
          ev.preventDefault();
          setError(null);
          setIsLoading(true);
          try {
            const result = await fetch("/auth", {
              headers: {
                Authorization: `Bearer ${password}`,
              },
            }).then((res) => res.json());
            if (
              result.data.role === requiredRole ||
              result.data.role === "DM"
            ) {
              onAuthenticate(password);
            } else {
              setError("Mot de passe invalide. Veuillez réessayer.");
            }
          } catch {
            setError("Impossible de se connecter. Vérifiez votre réseau.");
          } finally {
            setIsLoading(false);
          }
        }}
      >
        <InputField
          type="password"
          placeholder={`Mot de passe ${
            requiredRole === "DM" ? "MJ" : "joueur"
          }`}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          autoFocus
        />
        {error ? <ErrorBox>⚠ {error}</ErrorBox> : null}
        <SubmitButton type="submit" disabled={isLoading}>
          {isLoading ? "Connexion..." : "Se connecter"}
        </SubmitButton>
      </Form>
      <SwitchLink href={requiredRole === "DM" ? "/" : "/mj"}>
        {requiredRole === "DM" ? "→ Section joueurs" : "→ Section MJ"}
      </SwitchLink>
    </BackgroundImageContainer>
  );
};
