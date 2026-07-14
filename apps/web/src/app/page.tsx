"use client";

import { useState } from "react";
import Link from "next/link";
import ShaderBackground from "../components/ShaderBackground";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const bentoFeatures = [
    {
      title: "Detection Engine",
      desc: "Self-learning machine learning models optimizing threat pattern classification.",
      icon: "insights",
    },
    {
      title: "Graph Intelligence",
      desc: "Visualize transaction connections and multi-hop relationships.",
      icon: "hub",
    },
    {
      title: "Risk Scoring",
      desc: "Assesses risk score under sub-second latency targets.",
      icon: "speed",
    },
    {
      title: "KYC Validation",
      desc: "Cross-channel identity verification with deep data mapping integrations.",
      icon: "verified_user",
    },
    {
      title: "Real-time Filters",
      desc: "Over 250+ regression rules for transaction flows.",
      icon: "filter_list",
    },
    {
      title: "Identity Binding",
      desc: "Automated detection of disguised entities based on shared attributes.",
      icon: "fingerprint",
    },
    {
      title: "SaaS API Access",
      desc: "Clear REST APIs for seamless transaction data processing and integrations.",
      icon: "api",
    },
    {
      title: "Audit Trails",
      desc: "Cryptographically verifiable logs of all triage activities.",
      icon: "history_edu",
    },
    {
      title: "Continuous Learning",
      desc: "System keeps learning from alert resolutions.",
      icon: "sync",
    },
    {
      title: "Cohesive Team",
      desc: "Shared compliance dashboards for analysts and investigators.",
      icon: "groups",
    },
  ];

  const pipelineStages = [
    { name: "INGESTION", subtitle: "Kafka Streams", desc: "Streaming ingress", icon: "cloud" },
    { name: "PROCESSING", subtitle: "Anomaly Detection", desc: "ML Scoring", icon: "waves" },
    { name: "STORAGE", subtitle: "Graph Databases", desc: "Neo4j storage", icon: "database" },
    { name: "TREATMENT", subtitle: "SAR / Alert Queue", desc: "Action Trigger", icon: "desktop_windows" },
  ];

  const lifecycleTimeline = [
    { title: "Ingestion", desc: "Processing raw SWIFT/ISO 20022 messages", time: "+0ms" },
    { title: "Entity Resolution", desc: "Mapping transaction identifiers to unique profiles", time: "+5ms" },
    { title: "Social Graph Mapping", desc: "Correlating source and destination accounts to find rings", time: "+15ms" },
    { title: "Anomaly Scoring", desc: "Running GCN / ML models", time: "+25ms" },
    { title: "Explainability Analysis", desc: "Generating SHAP factors", time: "+35ms" },
    { title: "Risk Mitigation", desc: "Triggering account locks", time: "+42ms" },
    { title: "SAR Drafting", desc: "Generating FinCEN reports", time: "+5min" },
  ];

  const faqItems = [
    {
      q: "How does the platform detect money mule behavior?",
      a: "MuleShield AI combines Graph Convolutional Networks (GCN) and Gradient Boosted Decision Trees to analyze both transaction features (amounts, velocities) and network topology structure. This detects smurfing and layering loops in real-time.",
    },
    {
      q: "Can it integrate with existing AML systems?",
      a: "Yes. MuleShield AI supports webhook notifications and RESTful APIs, allowing it to seamlessly pipe real-time anomaly scores and SHAP factors into your existing core banking platform or compliance case workflow.",
    },
    {
      q: "What is the typical integration timeline?",
      a: "Standard integration via API takes less than 2 weeks. Custom enterprise deployments with historical database training typically require 4 to 6 weeks.",
    },
  ];

  return (
    <div className="font-body-md text-body-md overflow-x-hidden min-h-screen bg-[#07090e] text-on-surface">
      {/* Top Navbar */}
      <header className="fixed top-0 z-50 w-full bg-[#07090e]/80 backdrop-blur-md h-16 flex items-center justify-between px-margin-desktop border-b border-outline-variant/10">
        <div className="flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary font-bold text-3xl">shield</span>
          <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
            MuleShield AI
          </span>
        </div>
        <nav className="hidden md:flex gap-8">
          <a className="font-label-mono text-label-mono text-primary border-b border-primary pb-1" href="#platform">Platform</a>
          <a className="font-label-mono text-label-mono text-on-surface-variant hover:text-on-surface transition-colors" href="#features">Solutions</a>
          <a className="font-label-mono text-label-mono text-on-surface-variant hover:text-on-surface transition-colors" href="#timeline">Investigations</a>
          <a className="font-label-mono text-label-mono text-on-surface-variant hover:text-on-surface transition-colors" href="#pricing">Resources</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-on-surface-variant hover:text-on-surface text-body-sm font-semibold transition-colors">
            Sign In
          </Link>
          <Link href="/dashboard" className="bg-primary-container text-on-primary-container font-bold px-4 py-2 rounded-lg text-body-sm hover:opacity-90 transition-opacity">
            Request Demo
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen min-h-[900px] flex items-center justify-center pt-16">
        <div className="absolute inset-0 w-full h-full opacity-40">
          <ShaderBackground />
        </div>
        <div className="container mx-auto px-margin-desktop grid lg:grid-cols-2 items-center gap-12 relative z-10">
          <div className="space-y-8 max-w-2xl">
            {/* Pulsing Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-primary-container/10 border border-primary/20 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-mono text-[10px] uppercase tracking-widest text-primary font-semibold">
                ✦ ADVANCED ANTI-MULE DETECTION ENGINE
              </span>
            </div>

            <h1 className="font-display-kpi text-5xl md:text-6xl text-on-surface leading-tight font-extrabold">
              AI Powered <span className="gradient-text">Mule Account</span> Detection Platform
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-xl">
              Detect, investigate and dismantle financial crime rings using ML, Machine Learning and Graph intelligence. Institutional grade prevention for the modern financial landscape.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/dashboard"
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:translate-y-[-2px] transition-all shadow-lg shadow-primary/20"
              >
                Request a Demo
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <a
                href="#features"
                className="glass-panel text-on-surface border border-outline/30 px-8 py-4 rounded-xl font-bold hover:bg-white/5 transition-all"
              >
                Book Demo
              </a>
            </div>

            {/* Certifications Block */}
            <div className="pt-8 flex gap-4 items-start max-w-md border-t border-outline-variant/10">
              <span className="material-symbols-outlined text-primary text-3xl">verified</span>
              <div>
                <div className="font-bold text-sm text-on-surface">SOC 2 CERTIFIED PLATFORM</div>
                <div className="text-xs text-on-surface-variant leading-relaxed">
                  Proactive compliance and sub-second triggers for US, Euro and Asian banking channels.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Stats grid */}
      <section className="py-16 border-y border-outline-variant/10 bg-[#090b12]">
        <div className="container mx-auto px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center md:text-left">
            <div className="font-display-kpi text-4xl font-extrabold text-primary mb-1">1.0B+</div>
            <div className="text-caption text-on-surface-variant uppercase tracking-wider">Transactions Analyzed</div>
          </div>
          <div className="text-center md:text-left border-l border-outline-variant/10 pl-0 md:pl-8">
            <div className="font-display-kpi text-4xl font-extrabold text-primary mb-1">$500M+</div>
            <div className="text-caption text-on-surface-variant uppercase tracking-wider">Assets Guarded</div>
          </div>
          <div className="text-center md:text-left border-l border-outline-variant/10 pl-0 md:pl-8">
            <div className="font-display-kpi text-4xl font-extrabold text-primary mb-1">99.9%</div>
            <div className="text-caption text-on-surface-variant uppercase tracking-wider">Risk Detection Accuracy</div>
          </div>
          <div className="text-center md:text-left border-l border-outline-variant/10 pl-0 md:pl-8">
            <div className="font-display-kpi text-4xl font-extrabold text-primary mb-1">12k+</div>
            <div className="text-caption text-on-surface-variant uppercase tracking-wider">Active Investigations</div>
          </div>
        </div>
      </section>

      {/* Enterprise Intelligence Core Section (Bento grid) */}
      <section id="features" className="py-28 container mx-auto px-margin-desktop">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="font-headline-lg text-3xl md:text-4xl text-on-surface mb-4 font-bold">
            Enterprise Intelligence Core
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            Precision instruments for financial intelligence units, scalable across global networks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {bentoFeatures.map((feat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[#0e1220]/80 border border-outline-variant/20 hover:border-primary/50 hover:bg-[#11172a]/95 transition-all duration-300 group shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="material-symbols-outlined text-primary text-3xl mb-4 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </span>
                <h3 className="font-headline-sm text-sm font-semibold text-on-surface mb-2 truncate">
                  {feat.title}
                </h3>
                <p className="text-[11px] leading-relaxed text-on-surface-variant">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Architecture Flow Section */}
      <section className="py-24 bg-[#0a0d17] border-y border-outline-variant/10">
        <div className="container mx-auto px-margin-desktop grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="font-headline-lg text-3xl font-bold text-on-surface">
              Interactive Architecture
            </h2>
            <p className="text-on-surface-variant text-body-lg leading-relaxed">
              Capabilities of our Big Data and Advanced AI, processing millions of transfer requests per second with sub-50ms latency.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="text-body-sm">Kafka-based event streaming ingestion pipelines.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="text-body-sm">Model processing for transaction clustering.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="text-body-sm">PostgreSQL / Graph database storage architectures.</span>
              </li>
            </ul>
          </div>

          {/* Architecture nodes diagram */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pipelineStages.map((stage, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#0e1220] border border-outline-variant/30 text-center space-y-4 shadow-md hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-primary">{stage.icon}</span>
                </div>
                <div>
                  <div className="font-label-mono text-[10px] text-primary uppercase font-bold tracking-wider">
                    {stage.name}
                  </div>
                  <div className="text-xs text-on-surface font-semibold mt-1">{stage.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Intelligence Lifecycle Timeline Section */}
      <section id="timeline" className="py-28 container mx-auto px-margin-desktop">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="font-headline-lg text-3xl font-bold text-on-surface mb-4">
            The Intelligence Lifecycle
          </h2>
          <p className="text-on-surface-variant">
            Chronological stages of a transaction threat detection pipeline and automated reporting execution.
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical central line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-[2px] bg-primary/20 pointer-events-none"></div>

          <div className="space-y-12 relative z-10">
            {lifecycleTimeline.map((item, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={idx}
                  className={`flex flex-col md:flex-row items-center justify-between ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="w-full md:w-5/12" />
                  <div className="w-8 h-8 rounded-full bg-surface border-2 border-primary flex items-center justify-center z-20">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  </div>
                  <div className={`w-full md:w-5/12 p-5 rounded-2xl bg-[#0e1220] border border-outline-variant/30 shadow-md ${
                    isEven ? "md:text-right" : "md:text-left"
                  }`}>
                    <div className="flex items-center gap-3 justify-start md:justify-between mb-2">
                      <span className="font-bold text-sm text-primary">{item.title}</span>
                      <span className="font-label-mono text-xs px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-primary">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Screen Mock Showcase Section */}
      <section className="py-16 bg-[#07090e]">
        <div className="container mx-auto px-margin-desktop text-center">
          <div className="rounded-3xl border border-outline-variant/30 overflow-hidden shadow-2xl relative max-w-5xl mx-auto group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none"></div>
            {/* Custom glowing visual border */}
            <div className="absolute inset-0 border border-primary/20 rounded-3xl pointer-events-none group-hover:border-primary/50 transition-all duration-300"></div>
            <img
              className="w-full object-cover aspect-[16/10]"
              alt="MuleShield interactive network explorer workspace interface mockup"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBG5YBxdAPcpRz4rSGHtfEYDCn4JAXZPIivXJtXxCLieGm66yA96WrF7XyH8PnwGaD6WJgjNwEPpHKePmClG-X_khOHl-asqPh4aMjeJZhNd8ONFcFEW93pQuRDY8DPKbMhwIxgbggOLDvp4H-laBsvFaTg9D7QN-JpIIkNS7XXZRgEg-NKW0p51Z9UiUGkd2ExDH3kgnssXoo_NolJtMr39HGuxdq7taXmfnWyeYSCrwvq0ys0FTNc"
            />
          </div>
        </div>
      </section>

      {/* Operational Scaling (Pricing) Section */}
      <section id="pricing" className="py-28 bg-[#0a0d17] border-y border-outline-variant/10">
        <div className="container mx-auto px-margin-desktop">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="font-headline-lg text-3xl font-bold text-on-surface mb-4">
              Operational Scaling
            </h2>
            <p className="text-on-surface-variant">
              Choose the tier matching your institution's transaction throughput.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Standard */}
            <div className="p-8 rounded-2xl bg-[#0e1220] border border-outline-variant/30 flex flex-col justify-between h-[450px]">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Standard</h3>
                <p className="text-xs text-on-surface-variant mt-2">For regional banks and growing fintechs.</p>
                <div className="my-6">
                  <span className="text-3xl font-bold">$4,500</span>
                  <span className="text-xs text-on-surface-variant"> / month</span>
                </div>
                <ul className="space-y-3 font-body-sm text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                    <span>100k Ingress/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                    <span>API Anomaly Scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                    <span>Standard SLA support</span>
                  </li>
                </ul>
              </div>
              <Link href="/dashboard" className="w-full text-center py-3 rounded-xl border border-outline/30 text-on-surface font-bold text-body-sm hover:bg-white/5 transition-all">
                Start 30-Day Trial
              </Link>
            </div>

            {/* Professional */}
            <div className="p-8 rounded-2xl bg-[#0e1220] border-2 border-primary flex flex-col justify-between h-[480px] -translate-y-4 shadow-lg shadow-primary/10 relative">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                RECOMMENDED
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Professional</h3>
                <p className="text-xs text-on-surface-variant mt-2">For mid-sized and corporate institutions.</p>
                <div className="my-6">
                  <span className="text-3xl font-bold">$12,000</span>
                  <span className="text-xs text-on-surface-variant"> / month</span>
                </div>
                <ul className="space-y-3 font-body-sm text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                    <span>1M Ingress/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                    <span>Real-time Graph Workspace</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                    <span>SHAP Explainability Insights</span>
                  </li>
                </ul>
              </div>
              <Link href="/dashboard" className="w-full text-center py-3 rounded-xl bg-primary text-on-primary font-bold text-body-sm hover:opacity-90 transition-all">
                Start Professional
              </Link>
            </div>

            {/* Institutional */}
            <div className="p-8 rounded-2xl bg-[#0e1220] border border-outline-variant/30 flex flex-col justify-between h-[450px]">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Institutional</h3>
                <p className="text-xs text-on-surface-variant mt-2">For tier-1 banks and global networks.</p>
                <div className="my-6">
                  <span className="text-3xl font-bold">Custom</span>
                </div>
                <ul className="space-y-3 font-body-sm text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                    <span>Unlimited Ingress</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                    <span>Dedicated VPC deployment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                    <span>Dedicated ML support</span>
                  </li>
                </ul>
              </div>
              <Link href="/dashboard" className="w-full text-center py-3 rounded-xl bg-on-surface text-surface font-bold text-body-sm hover:opacity-90 transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Investigation FAQ Section */}
      <section className="py-28 container mx-auto px-margin-desktop">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-headline-lg text-3xl font-bold text-center mb-16">
            Investigation FAQ
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="border border-outline-variant/30 rounded-2xl overflow-hidden bg-[#0e1220]/50 transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex justify-between items-center p-6 text-left font-bold text-on-surface hover:bg-[#0e1220] transition-colors"
                >
                  <span className="text-sm md:text-body-md">{item.q}</span>
                  <span className={`material-symbols-outlined transition-transform duration-300 ${
                    activeFaq === idx ? "rotate-180" : ""
                  }`}>
                    expand_more
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    activeFaq === idx ? "max-h-40 border-t border-outline-variant/20 p-6" : "max-h-0"
                  }`}
                >
                  <p className="text-xs md:text-body-sm text-on-surface-variant leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#04060b] border-t border-outline-variant/10 pt-20 pb-12">
        <div className="container mx-auto px-margin-desktop grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary font-bold text-3xl">shield</span>
              <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
                MuleShield AI
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
              Any banking/financial institution with stream-level integrations can request custom model deployments for enhanced integrity.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-xs mb-6 text-on-background uppercase tracking-wider">Product</h5>
            <ul className="space-y-3 text-xs text-on-surface-variant">
              <li><Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/explorer">Graph Workspace</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/alerts">API Specifications</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/cases">SAR Compile</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-xs mb-6 text-on-background uppercase tracking-wider">Resources</h5>
            <ul className="space-y-3 text-xs text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">Case Studies</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">White Papers</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Developer API</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Security Docs</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-xs mb-6 text-on-background uppercase tracking-wider">Company</h5>
            <ul className="space-y-3 text-xs text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">Careers</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="container mx-auto px-margin-desktop pt-8 border-t border-outline-variant/10 text-center text-[10px] font-label-mono text-on-surface-variant">
          <div>© 2026 MuleShield AI. All rights reserved. Real-time intelligence for financial integrity.</div>
        </div>
      </footer>
    </div>
  );
}
