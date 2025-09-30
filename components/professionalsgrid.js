// components/professionalsgrid.js
export default function ProfessionalsGrid() {
  const people = [
    { name: "Carlos Torres", role: "Barbero", img: "/images/carlos-torres.jpg" },
    { name: "Juan Pérez", role: "Especialista en barbas", img: "/images/juan-perez.jpg" },
    { name: "Laura Gómez", role: "Colorista", img: "/images/laura-gomez.jpg" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {people.map((p, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow text-center">
          <div className="w-28 h-28 mx-auto rounded-full overflow-hidden mb-3">
            <img src={p.img} alt={p.name} className="w-full h-full object-cover"/>
          </div>
          <h4 className="font-semibold">{p.name}</h4>
          <p className="text-sm text-muted">{p.role}</p>
        </div>
      ))}
    </div>
  );
}
