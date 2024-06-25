import Layout from "./Layout";
import '../style/about.css';

export default function About() {
    return (
      <div>
        <Layout />
        <div className="about-page">
          <h2>About Us</h2>
          <p>Welcome to our Cafe Order Online!</p>
          <p>Address: 410 W Georgia St #1400, Vancouver, BC V6B 1Z3</p>
        </div>
      </div>
    )
  }
  