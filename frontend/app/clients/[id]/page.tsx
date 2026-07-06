"use client"

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getClientById } from '@/lib/api/clients';
import { getProjects } from '@/lib/api/projects';
import { ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, FileText, Briefcase, DollarSign, Clock, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  // Fetch client details
  const { data: clientData, isLoading: isClientLoading, error: clientError } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClientById(clientId),
    enabled: !!clientId,
  });

  // Fetch projects for this client
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['client-projects', clientId],
    queryFn: () => getProjects('', clientId, 1, 100),
    enabled: !!clientId,
  });

  const client = clientData?.client;
  const projects = projectsData?.projects || [];

  const isLoading = isClientLoading || isProjectsLoading;

  // Financial calculations
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-4">
        <div className="w-10 h-10 border-4 border-t-indigo-500 border-white/5 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Loading client workspace...</p>
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-6 rounded-2xl">
          <p className="font-semibold">Client not found or access denied.</p>
        </div>
        <button 
          onClick={() => router.push('/clients')}
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 min-h-screen">
      
      {/* Back navigation */}
      <div>
        <Link href="/clients">
          <span className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Clients Workspace
          </span>
        </Link>
      </div>

      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{client.name}</h1>
            <p className="text-indigo-400 font-semibold text-sm mt-1">{client.company}</p>
          </div>
        </div>
        
        {/* Quick stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto">
          <div className="bg-slate-950/45 p-3.5 rounded-xl border border-white/5 text-center">
            <span className="text-xs text-slate-400 block">Total Budget</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block">
              ${totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-950/45 p-3.5 rounded-xl border border-white/5 text-center">
            <span className="text-xs text-slate-400 block">Active Projects</span>
            <span className="text-lg font-bold text-indigo-400 mt-1 block">
              {activeProjectsCount}
            </span>
          </div>
          <div className="bg-slate-950/45 p-3.5 rounded-xl border border-white/5 text-center col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-400 block">Completed</span>
            <span className="text-lg font-bold text-purple-400 mt-1 block">
              {completedProjects} / {projects.length}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Contact info */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-6 backdrop-blur-md shadow-xl">
            <h3 className="text-lg font-bold border-b border-white/5 pb-3">Client Profile</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <Mail className="w-5 h-5 text-indigo-400 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Email Contact</span>
                  <span className="text-sm font-medium text-slate-200 mt-0.5 block">{client.email}</span>
                </div>
              </div>

              {client.phone && (
                <div className="flex items-start gap-3.5">
                  <Phone className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Phone Number</span>
                    <span className="text-sm font-medium text-slate-200 mt-0.5 block">{client.phone}</span>
                  </div>
                </div>
              )}

              {client.address && (
                <div className="flex items-start gap-3.5">
                  <MapPin className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Billing Address</span>
                    <span className="text-sm font-medium text-slate-200 mt-0.5 block">{client.address}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3.5">
                <Calendar className="w-5 h-5 text-indigo-400 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Client Since</span>
                  <span className="text-sm font-medium text-slate-200 mt-0.5 block">
                    {new Date(client.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {client.notes && (
              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Relationship Notes</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/20 p-3 rounded-xl border border-white/5">
                  {client.notes}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right column: Projects overview */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
              <h3 className="text-lg font-bold">Associated Projects</h3>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold">
                {projects.length} total
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Briefcase className="w-12 h-12 text-slate-500 mx-auto opacity-75 animate-pulse" />
                <h4 className="font-bold text-slate-300">No projects linked</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  There are no contracts linked to this client. Create one in the Projects view.
                </p>
                <div className="pt-2">
                  <Link href="/projects">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer">
                      Create Project
                    </span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div 
                    key={project._id}
                    className="p-5 rounded-2xl bg-slate-950/30 border border-white/5 hover:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all"
                  >
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-slate-100">{project.name}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>${project.budget.toLocaleString()}</span>
                        </span>
                        {project.hourlyRate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>${project.hourlyRate}/hr</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-purple-400" />
                          <span>{project.progress}% Complete</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                        project.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                        project.status === 'On Hold' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                        'bg-slate-500/10 text-slate-300 border border-white/10'
                      }`}>
                        {project.status}
                      </span>
                      <Link href={`/projects/${project._id}`}>
                        <span className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
                          View details
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
