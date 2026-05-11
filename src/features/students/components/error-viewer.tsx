import { PS2 } from 'core/src/progsnap/ProgSnap2Builder';
import React from 'react';

interface ErrorViewerProps {
    history?: PS2.EditHistoryFrame[] | null;
    onJump: (frameIndex: number) => void;
}

export default function ErrorViewer({ history, onJump }: ErrorViewerProps) {
    if (!history || !Array.isArray(history)) return null;

    const rows: { frameIndex: number; errArgs: unknown[] }[] = [];

    history.forEach((frame: PS2.EditHistoryFrame, frameIndex: number) => {
        const errs = frame && frame.errors;
        if (Array.isArray(errs) && errs.length > 0) {
            errs.forEach((errArgs: unknown[]) => {
                rows.push({ frameIndex, errArgs: Array.isArray(errArgs) ? errArgs : [errArgs] });
            });
        }
    });

    if (rows.length === 0) return null;

    return (
        <div className="p-2 border-t border-gray-200 bg-red-50">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-red-800">History Generation Errors</h3>
            </div>
            <div className="overflow-auto max-h-48">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-left px-2 py-1">Index</th>
                            <th className="text-left px-2 py-1">Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={`${r.frameIndex}-${i}`} className="border-t">
                                <td className="px-2 py-1 align-top">
                                    <a
                                        href="#"
                                        className="text-blue-600 hover:underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            try {
                                                console.error(...r.errArgs);
                                            } catch {
                                                // fallback if spread fails
                                                console.error(r.errArgs);
                                            }
                                            onJump(r.frameIndex);
                                        }}
                                    >
                                        {r.frameIndex}
                                    </a>
                                </td>
                                <td className="px-2 py-1">
                                    {r.errArgs.map((a) => String(a)).join(' ')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
