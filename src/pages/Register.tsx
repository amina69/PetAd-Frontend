import { useState } from "react";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Divider } from "../components/common/Divider";
import { GoogleIcon } from "../components/common/GoogleIcon";
import "../styles/Register.css";
import { LeftPanel } from "../components/layout/LeftPanel";

interface FormData {
  email: string;
  fullName: string;
  nin: string;
  password: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    fullName: "",
    nin: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  const handleGoogleSignup = () => {
    console.log("Google signup clicked");
  };

  return (
    <div className="register-container">
      {/* Left Panel - Fixed width of 600px with peach background */}
    <LeftPanel/>

      {/* Right Panel - White background */}
      <div className="right-panel">
        <div className="right-panel-content">
          <div className="form-container">
            <h2 className="form-title">Create an account</h2>

            <Button variant="google" onClick={handleGoogleSignup}>
              Create account with Google
              <GoogleIcon />
            </Button>

            <Divider />

            <form onSubmit={handleSubmit}>
              <Input
                type="email"
                name="email"
                label="Email Address"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
              />

              <Input
                type="text"
                name="fullName"
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
              />

              <Input
                type="text"
                name="nin"
                label="NIN (National Identity Number)"
                placeholder="Enter your NIN"
                value={formData.nin}
                onChange={handleChange}
              />

              <Input
                type="password"
                name="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />

              <Button type="submit" variant="primary">
                Create an account
              </Button>
            </form>

            <p className="login-link">
              Already have an account?{" "}
              <a href="/login" className="login">Login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}