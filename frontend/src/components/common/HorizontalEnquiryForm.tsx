import { useState } from "react";
import { Button } from "./Button";
import { submitToGoogleSheets } from "../../utils/googleSheets";
import { sendEmailNotification } from "../../utils/emailNotification";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

export const HorizontalEnquiryForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    phone: "",
    message: "",
    venue: "",
    budget: "",
  });


  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.date ||
      !formData.message ||
      !formData.venue ||
      !formData.budget
    ) {
      alert("Please fill in all fields including the Message.");
      return;
    }

    try {
      // Trigger background submissions (non-blocking)
      submitToGoogleSheets({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        eventDate: formData.date,
        message: formData.message,
        venue: formData.venue,
        budget: formData.budget,
        source: "Horizontal Enquiry Form",
      });

      sendEmailNotification({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date: formData.date,
        message: formData.message,
        venue: formData.venue,
        budget: formData.budget,
      });

      // Redirect instantly
      navigate("/thank-you");

      setFormData({
        name: "",
        email: "",
        date: "",
        phone: "",
        message: "",
        venue: "",
        budget: "",
      });
    } catch (error) {
      console.error("Submission error", error);
      // Navigate anyway for instant feel
      navigate("/thank-you");
    }
  };

  return (
    <div className="bg-stone-50 py-12 px-6 border-y border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-xl p-6 md:p-8 flex flex-col md:flex-row items-start gap-6 border-t-4 border-primary">
          <div className="w-full md:w-1/4">
            <h3 className="font-display text-xl text-gray-900">
              Begin your Inquiry
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Tell us about your event and we'll get back to you shortly.
            </p>
          </div>

          <div className="w-full md:w-3/4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-stone-50 border-none px-4 py-3 focus:ring-1 focus:ring-primary text-gray-600"
              />
              <input
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-stone-50 border-none px-4 py-3 focus:ring-1 focus:ring-primary text-gray-600"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full bg-stone-50 border-none px-4 py-3 focus:ring-1 focus:ring-primary text-gray-600"
              />
              <input
                type="text"
                placeholder="Event Date *"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full bg-stone-50 border-none px-4 py-3 focus:ring-1 focus:ring-primary text-gray-600"
              />
              <input
                type="text"
                placeholder="Event Venue"
                required
                value={formData.venue}
                onChange={(e) =>
                  setFormData({ ...formData, venue: e.target.value })
                }
                className="w-full bg-stone-50 border-none px-4 py-3 focus:ring-1 focus:ring-primary text-gray-600"
              />
              <select
                required
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                className="w-full bg-stone-50 border-none px-4 py-3 focus:ring-1 focus:ring-primary text-gray-600 appearance-none"
              >
                <option value="" disabled>
                  Budget Range
                </option>
                <option value="$10k - $15k">$10k – $15k</option>
                <option value="$15k - $20k">$15k – $20k</option>
                <option value="$20k - $30k">$20k – $30k</option>
                <option value="$30k and above">$30k and above</option>
              </select>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Your Message"
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full bg-stone-50 border-none px-4 py-3 focus:ring-1 focus:ring-primary text-gray-600"
                />
                <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
              >
                Check Availability
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};