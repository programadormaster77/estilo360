const services = [
  { title: "Corte de Cabello", description: "Estilo y precisión.", icon: "/images/servicios-corte.jpg" },
  { title: "Tintes y Color", description: "Colores modernos y naturales.", icon: "/images/servicios-tinte.jpg" },
  { title: "Barba", description: "Perfilado y cuidado profesional.", icon: "/images/servicos-barba.jpg" },
  { title: "Afeitado", description: "Suave, limpio y rápido.", icon: "/images/servicios-afeitado.jpg" },
];

export default function ServicesGrid() {
  return (
    <>
      {services.map((service, index) => (
        <div
          key={index}
          className="bg-white/20 backdrop-blur-md rounded-xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition-transform"
        >
          <img src={service.icon} alt={service.title} className="w-16 h-16 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
          <p className="text-white/90">{service.description}</p>
        </div>
      ))}
    </>
  );
}
