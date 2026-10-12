import { Button } from '../primitives/Button';

export interface AmbNotifyButtonProps {
  /** Brand the alert is for; read out with the button. */
  brand: string;
  on: boolean;
  onToggle: () => void;
}

/** "Notify me" toggle for a closed or future campaign (canvas notes n-a1, n-a1b). States: off ("Notify me"), on ("We'll email you"). */
export function AmbNotifyButton({ brand, on, onToggle }: AmbNotifyButtonProps) {
  return (
    <Button variant={on ? 'primary' : 'secondary'} aria-pressed={on} onClick={onToggle}>
      {on ? "We'll email you" : 'Notify me'}
      {' '}<span className="wl-visually-hidden">about {brand}</span>
    </Button>
  );
}
