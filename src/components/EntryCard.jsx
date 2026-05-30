export default function EntryCard({ entry }) {
  return (
    <figure className="card">
      <span className="tape" aria-hidden="true" />
      <div className="card-photo">
        <img src={entry.image_url} alt={entry.name} loading="lazy" />
      </div>
      <figcaption>
        <div className="card-name">{entry.name}</div>
        <div className="card-roll">Roll No. {entry.roll_number}</div>
        {entry.quote && <p className="card-quote">“{entry.quote}”</p>}
      </figcaption>
    </figure>
  );
}
