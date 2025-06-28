import SplitText from "@/blocks/TextAnimations/SplitText/SplitText";

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 mb-8">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Revolutionizing Emergency Response
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              <SplitText
                text="AI-Powered Emergency"
                splitType="words"
                duration={0.8}
                delay={100}
                ease="power3.out"
                className="block"
              />
              <SplitText
                text="Dispatch Revolution"
                splitType="words"
                duration={0.6}
                delay={50}
                ease="power3.out"
                className="block mt-2 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"
              />
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Intelligent call routing and mental health crisis detection that helps 
              understaffed 911 centers save more lives with faster, smarter responses.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a
                href="/dashboard"
                className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Go to Dashboard
              </a>
              <a
                href="#"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                Watch Demo
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-red-600 mb-2">80%</div>
                <div className="text-gray-600">Dispatchers experience burnout</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-red-600 mb-2">35%</div>
                <div className="text-gray-600">Faster response times</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-red-600 mb-2">24/7</div>
                <div className="text-gray-600">AI-powered support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Emergency Services Choose Rapid Relief AI
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced AI technology designed specifically for emergency response teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Intelligent Call Routing</h3>
              <p className="text-gray-600 leading-relaxed">
                AI automatically categorizes and routes calls to the most appropriate responders, reducing response times and improving outcomes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Mental Health Detection</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced algorithms identify mental health crises in real-time, ensuring specialized mental health responders are dispatched when needed.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Reduce Dispatcher Burnout</h3>
              <p className="text-gray-600 leading-relaxed">
                Automated assistance and intelligent decision support help reduce stress on overworked dispatchers, improving job satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Emergency Response?
          </h2>
          <p className="text-xl text-red-100 mb-8 leading-relaxed">
            Join leading emergency services already using Rapid Relief AI to save more lives.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Go to Dashboard
          </a>
        </div>
      </section>
    </div>
  );
}
