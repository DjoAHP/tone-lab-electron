// src/services/firebaseService.ts

import {
    collection,
    doc,
    getDocs,
    addDoc,
    deleteDoc,
    setDoc,
    query,
    orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Plugin, ToneLabProject } from '../types';

// ── Collection references ─────────────────────────────────────
const pluginsCol = collection(db, 'plugins');
const projetsCol = collection(db, 'projects');

// ── Plugins ───────────────────────────────────────────────────

export async function fetchPlugins(): Promise<Plugin[]> {
    try {
        const snap = await getDocs(query(pluginsCol, orderBy('date_ajout', 'desc')));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Plugin));
    } catch (err) {
        console.error('fetchPlugins error:', err);
        return [];
    }
}

export async function addPlugin(plugin: Omit<Plugin, 'id'>): Promise<Plugin> {
    const ref = await addDoc(pluginsCol, plugin);
    return { id: ref.id, ...plugin };
}

export async function deletePlugin(id: string): Promise<void> {
    await deleteDoc(doc(db, 'plugins', id));
}

// ── Projects ──────────────────────────────────────────────────

export async function saveProject(projet: ToneLabProject): Promise<void> {
    try {
        const slug = projet.nom
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase();
        await setDoc(doc(db, 'projects', slug), projet);
    } catch (err) {
        console.error('saveProject error:', err);
    }
}

export async function fetchProjects(): Promise<ToneLabProject[]> {
    try {
        const snap = await getDocs(projetsCol);
        return snap.docs.map((d) => d.data() as ToneLabProject);
    } catch (err) {
        console.error('fetchProjects error:', err);
        return [];
    }
}