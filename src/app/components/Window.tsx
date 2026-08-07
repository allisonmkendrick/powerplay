'use client';

/**
 * A window, as a 2001 desktop would draw one: title bar with the three
 * controls, hard border, hard offset shadow. The controls are decorative,
 * so they are hidden from assistive technology rather than announced as
 * buttons that do nothing.
 */

type WindowProps = {
  title: string;
  children: React.ReactNode;
  dialog?: boolean;
};

export default function Window({ title, children, dialog }: WindowProps) {
  return (
    <section className={dialog ? 'window window--dialog' : 'window'}>
      <div className="window__bar">
        <span className="window__title">{title}</span>
        <span className="window__controls" aria-hidden="true">
          <span className="dot-min" />
          <span className="dot-max" />
          <span className="dot-close" />
        </span>
      </div>
      <div className="window__body">{children}</div>
    </section>
  );
}
