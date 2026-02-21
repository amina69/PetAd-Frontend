
import logo from "../../assets/images/logo.png";
import petImage from "../../assets/images/pet.png";

export function LeftPanel() {
  return (
    <div className="left-panel">
      {/* Top Content */}
      <div className="left-content">
        {/* Logo */}
        <div className="logo-wrapper">
          <img src={logo} alt="PETAD Logo" className="logo-img" />
        </div>

        {/* Hero Content */}
        <div className="hero-content">
        <h1 className="hero-title">
  Connecting Pet <br />
  Lovers <span className="heart">❣️</span> For Easier <br />
  Adoption!
</h1>

          <p className="hero-description">
            List your pets for adoption or discover pets/animals
            listed for adoption by their owners
          </p>
        </div>
      </div>

      {/* Bottom Pet Image */}
      <img
        src={petImage}
        alt="Dog, bird and cat"
        className="pet-image"
      />
    </div>
  );
}