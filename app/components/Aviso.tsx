type Props = {
  tipo: "error" | "exito";
  children: React.ReactNode;
};

export default function Aviso({ tipo, children }: Props) {
  return (
    <div
      className={`aviso aviso-${tipo}`}
      role={tipo === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
