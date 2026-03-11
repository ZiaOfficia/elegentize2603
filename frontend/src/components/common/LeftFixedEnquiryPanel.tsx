import { Mail, Calendar, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../common/Button";
import { submitToGoogleSheets } from "../../utils/googleSheets";
import { sendEmailNotification } from "../../utils/emailNotification";

export const LeftFixedEnquiryPanel = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button (Vertical text) */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-white py-6 px-2 rounded-l-md shadow-lg hover:bg-opacity-90 transition-all font-bold uppercase tracking-widest text-xs writing-vertical"
          style={{ writingMode: "vertical-rl" }}
        >
          Inquire Now
        </button>
      </div>

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full flex flex-col p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-display text-xl">Quick Inquiry</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-800"
            >
              <X size={24} />
            </button>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              try {
                // Trigger background submissions (non-blocking)
                submitToGoogleSheets({
                  name: formData.get("name") as string,
                  email: formData.get("email") as string,
                  phone: formData.get("phone") as string,
                  eventDate: formData.get("eventDate") as string,
                  venue: formData.get("venue") as string,
                  budget: formData.get("budget") as string,
                  serviceName: "Side Panel Inquiry",
                });

                sendEmailNotification({
                  name: formData.get("name") as string,
                  email: formData.get("email") as string,
                  phone: formData.get("phone") as string,
                  eventDate: formData.get("eventDate") as string,
                  venue: formData.get("venue") as string,
                  budget: formData.get("budget") as string,
                  source: "Side Panel Inquiry",
                });

                // Redirect instantly
                navigate("/thank-you");
              } catch (err) {
                console.error("Submission error", err);
                navigate("/thank-you");
              }
            }}
          >
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-gray-500">
                Name
              </label>
              <input
                name="name"
                required
                type="text"
                className="w-full bg-stone-50 border border-gray-200 p-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-gray-500">
                Email
              </label>
              <input
                name="email"
                required
                type="email"
                className="w-full bg-stone-50 border border-gray-200 p-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-gray-500">
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                className="w-full bg-stone-50 border border-gray-200 p-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-gray-500">
                Event Venue
              </label>
              <input
                name="venue"
                required
                type="text"
                className="w-full bg-stone-50 border border-gray-200 p-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-gray-500">
                Budget Range
              </label>
              <select
                name="budget"
                required
                className="w-full bg-stone-50 border border-gray-200 p-2 focus:border-primary focus:outline-none text-gray-500 appearance-none"
              >
                <option value="" disabled selected>
                  Select Budget
                </option>
                <option value="$10k - $15k">$10k – $15k</option>
                <option value="$15k - $20k">$15k – $20k</option>
                <option value="$20k - $30k">$20k – $30k</option>
                <option value="$30k and above">$30k and above</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-gray-500">
                Event Date
              </label>
              <input
                name="eventDate"
                type="date"
                className="w-full bg-stone-50 border border-gray-200 p-2 focus:border-primary focus:outline-none text-gray-500"
              />
            </div>
            <Button type="submit" className="w-full mt-4">
              Send Request
            </Button>
          </form>

          <div className="mt-auto pt-8 border-t border-gray-100">
            <div className="flex items-center space-x-3 mb-4 text-sm text-gray-600">
              <Mail size={16} className="text-primary" />
              <span>info@elegantize.com</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Calendar size={16} className="text-primary" />
              <span>Mon - Fri: 9am - 6pm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
