import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, QrCode, CheckCircle, Clock, MapPin, AlertTriangle, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import ChecklistExecucao from "../components/mobile/ChecklistExecucao";
import ScannerQR from "../components/mobile/ScannerQR";
import { Layout } from "@/components/Layout";

export default function TechMobile() {
	const [etapa, setEtapa] = useState<'scanner'|'detalhes'|'checklist'|'finalizar'>('scanner');
	const [codigoBusca, setCodigoBusca] = useState('');
	const [ativoAtual, setAtivoAtual] = useState<any | null>(null);
	const [osAtual, setOsAtual] = useState<any | null>(null);
	const [checklistAtual, setChecklistAtual] = useState<any | null>(null);
	const [showCamera, setShowCamera] = useState(false);
	const [user, setUser] = useState<any | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const queryClient = useQueryClient();

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			setUser(data.user || null);
		}).catch(() => {});
	}, []);

	// Garantir que o stream seja atribuído quando a câmera for mostrada
	useEffect(() => {
		if (!showCamera || !streamRef.current) return;

		// Aguardar um pouco para garantir que o elemento video foi renderizado
		const timer = setTimeout(() => {
			if (videoRef.current && streamRef.current) {
				// Atribuir stream ao elemento video
				videoRef.current.srcObject = streamRef.current;
				
				// Tentar reproduzir
				videoRef.current.play().catch(err => {
					console.error('Erro ao reproduzir vídeo:', err);
					// Se falhar, tentar novamente após um delay
					setTimeout(() => {
						if (videoRef.current && streamRef.current) {
							videoRef.current.play().catch(console.error);
						}
					}, 200);
				});
			}
		}, 100);

		return () => clearTimeout(timer);
	}, [showCamera]);

	const safeFormatDate = (value: any, fmt: string) => {
		try {
			const d = new Date(value);
			if (isNaN(d.getTime())) return "-";
			return format(d, fmt);
		} catch {
			return "-";
		}
	};

		const { data: ativos = [] } = useQuery<any[], Error>({ queryKey: ['ativos'], queryFn: async () => {
			const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
			return (data as any[]) || [];
		} });

		const { data: ordensServico = [] } = useQuery<any[], Error>({ queryKey: ['ordensServico'], queryFn: async () => {
			const { data } = await supabase.from('work_orders').select('*').order('created_at', { ascending: false });
			return (data as any[]) || [];
		} });

			const { data: checklists = [] } = useQuery<any[], Error>({ queryKey: ['checklists'], queryFn: async () => {
				try {
					// Use a dynamic cast to avoid strict Supabase typed schema issues in this repo.
					const { data } = await (supabase as any).from('checklist_templates').select('*');
					return (data as any[]) || [];
				} catch (err) {
					return [];
				}
			} });

			const updateAtivoMutation = useMutation({
				mutationFn: async ({ id, data }: any) => {
					return await supabase.from('assets').update(data).eq('id', id);
				},
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ativos'] })
			});

			const updateOSMutation = useMutation({
				mutationFn: async ({ id, data }: any) => {
					return await supabase.from('work_orders').update(data).eq('id', id);
				},
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ordensServico'] })
			});

			const createOSMutation = useMutation({
				mutationFn: async (osData: any) => {
					return await supabase.from('work_orders').insert([osData]);
				},
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ordensServico'] })
			});

			const createChecklistRespostaMutation = useMutation({
				mutationFn: async (data: any) => {
					return await supabase.from('asset_history').insert([data]);
				},
				onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asset_history'] })
			});

	const handleBuscar = () => {
		const ativo = (ativos as any[]).find(a =>
			a.asset_code?.toLowerCase() === codigoBusca.toLowerCase() ||
			a.id === codigoBusca ||
			a.serial_number === codigoBusca
		);

		if (ativo) {
			setAtivoAtual(ativo);
			setEtapa('detalhes');
		} else {
			alert('Ativo não encontrado!');
		}
	};

	const iniciarCamera = async () => {
		try {
			// Verificar se a API está disponível
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				alert('Câmera não disponível neste navegador. Use HTTPS ou localhost.');
				return;
			}

			const stream = await navigator.mediaDevices.getUserMedia({ 
				video: { 
					facingMode: 'environment',
					width: { ideal: 1280 },
					height: { ideal: 720 }
				}, 
				audio: false 
			});
			
			streamRef.current = stream;
			setShowCamera(true);
			
			// Aguardar um pouco para garantir que o elemento video foi renderizado
			setTimeout(() => {
				if (videoRef.current && streamRef.current) {
					videoRef.current.srcObject = streamRef.current;
					videoRef.current.play().catch(err => {
						console.error('Erro ao reproduzir vídeo:', err);
					});
				}
			}, 100);
		} catch (err: any) {
			console.error('Erro ao acessar câmera:', err);
			let errorMsg = 'Não foi possível acessar a câmera.';
			
			if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
				errorMsg = 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
			} else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
				errorMsg = 'Nenhuma câmera encontrada no dispositivo.';
			} else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
				errorMsg = 'A câmera está sendo usada por outro aplicativo.';
			} else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
				errorMsg = 'As configurações da câmera não são suportadas.';
			}
			
			alert(errorMsg);
		}
	};

	const pararCamera = () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(track => track.stop());
			streamRef.current = null;
		}
		setShowCamera(false);
	};

	const obterChecklistDoAtivo = (ativo: any, tipoManutencao: string) => {
		// 1. Tenta buscar do localStorage primeiro (checklists criados no sistema)
		if (ativo?.id) {
			try {
				const stored = localStorage.getItem(`checklist_${ativo.id}`);
				if (stored) {
					const parsed = JSON.parse(stored);
					// Converte o formato do checklist para o formato esperado pelo ChecklistExecucao
					if (parsed.items && parsed.items.length > 0) {
						return {
							id: parsed.id,
							name: parsed.name,
							nome: parsed.name,
							itens: parsed.items.map((item: any) => ({
								id: item.id,
								label: item.label,
								title: item.label,
								text: item.label,
								type: item.type
							})),
							items: parsed.items
						};
					}
				}
			} catch (error) {
				console.error("Erro ao carregar checklist do localStorage:", error);
			}
		}

		// 2. Busca checklist personalizado do ativo
		if (ativo?.checklist_personalizado && ativo.checklist_personalizado.itens?.length > 0) return ativo.checklist_personalizado;
		
		// 3. Busca por template_id
		if (ativo?.checklist_template_id) {
			const template = (checklists as any[]).find(c => c.id === ativo.checklist_template_id);
			if (template) return template;
		}
		
		// 4. Busca por tipo de ativo
		return (checklists as any[]).find(c => c.tipo_ativo === ativo.tipo_ativo) || null;
	};

	const handleIniciarOS = async (os: any) => {
		let tipoManutencao = 'preventiva_mensal';
		if (os.order_type === 'preventiva') {
			tipoManutencao = os.description?.toLowerCase().includes('semestral') ? 'preventiva_semestral' : 'preventiva_mensal';
		} else if (os.order_type === 'corretiva') {
			tipoManutencao = 'corretiva';
		}

		const checklistCorrespondente = obterChecklistDoAtivo(ativoAtual, tipoManutencao.replace('preventiva_', ''));

		if (checklistCorrespondente) {
			setOsAtual({ ...os, tipo_manutencao: tipoManutencao });
			setChecklistAtual(checklistCorrespondente);
			await updateOSMutation.mutateAsync({ id: os.id, data: { status: 'em_andamento' } });
			setEtapa('checklist');
		} else {
			alert('⚠️ Nenhum checklist disponível para este equipamento.');
		}
	};

	const handleAbrirOSCorretiva = async () => {
		if (!ativoAtual) return;
		const novaOS = {
			order_number: `OS-${Date.now()}`,
			asset_id: ativoAtual.id,
			order_type: 'corretiva',
			status: 'em_andamento',
			priority: 'alta',
			scheduled_date: format(new Date(), 'yyyy-MM-dd'),
			description: 'Manutenção corretiva - identificada no campo'
		};
		await createOSMutation.mutateAsync(novaOS);
		const checklistCorretivo = obterChecklistDoAtivo(ativoAtual, 'corretiva');
		if (checklistCorretivo) {
			setOsAtual(novaOS);
			setChecklistAtual(checklistCorretivo);
			setEtapa('checklist');
		} else {
			alert('⚠️ Nenhum checklist disponível para manutenção corretiva.');
		}
	};

	const handleSalvarChecklist = async (dadosChecklist: any) => {
		if (!ativoAtual) return;
		const checklistData = {
			asset_id: ativoAtual.id,
			work_order_id: osAtual?.id || null,
			action_type: 'manutencao',
			description: dadosChecklist.observacoes_gerais || null,
			technician_id: user?.id || null,
			photos: dadosChecklist.fotos || [],
			checklist_data: dadosChecklist.respostas || [],
			signature_data: dadosChecklist.assinatura_digital || null,
			created_at: new Date().toISOString()
		};

		await createChecklistRespostaMutation.mutateAsync(checklistData);

		if (osAtual?.id) {
			await updateOSMutation.mutateAsync({ id: osAtual.id, data: { status: 'concluida', completed_date: new Date().toISOString() } });
		}

		if (ativoAtual?.id) {
			await updateAtivoMutation.mutateAsync({ id: ativoAtual.id, data: { updated_at: new Date().toISOString() } });
		}

		setEtapa('finalizar');
	};

	const resetarScanner = () => {
		setEtapa('scanner');
		setCodigoBusca('');
		setAtivoAtual(null);
		setOsAtual(null);
		setChecklistAtual(null);
	};

	const osDoAtivo = ativoAtual ? (ordensServico as any[])
		.filter((os: any) => os.asset_id === ativoAtual.id)
		.sort((a: any, b: any) => {
			const statusOrder: any = { pendente: 0, em_andamento: 1, concluida: 2, cancelada: 3 };
			if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status];
			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
		}) : [];

	const osAbertas = (osDoAtivo as any[]).filter((os: any) => os.status === 'pendente' || os.status === 'em_andamento');
	const osHistorico = (osDoAtivo as any[]).filter((os: any) => os.status === 'concluida').slice(0,3);

	if (etapa === 'scanner') {
		return (
			<Layout>
			<div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-4">
				<div className="max-w-md mx-auto">
					<div className="text-center mb-8 pt-8">
						<div className="w-20 h-20 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto mb-4"><QrCode className="w-10 h-10 text-white"/></div>
						<h1 className="text-4xl font-bold text-white mb-2">GAC Mobile</h1>
						<p className="text-blue-100 text-lg">Modo Técnico</p>
					</div>

					<Card className="bg-white/95 backdrop-blur-lg shadow-2xl border-none mb-6">
						<CardContent className="p-8">
							<h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Escanear Ativo</h2>

							<div className="space-y-4">
								<div className="relative">
									<Input placeholder="Digite o código (ex: AC-001)" value={codigoBusca} onChange={(e) => setCodigoBusca(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleBuscar()} className="text-lg h-14 pr-12 text-center font-mono" />
								</div>

								<Button onClick={handleBuscar} className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700" disabled={!codigoBusca.trim()}>Buscar Ativo</Button>

								<div className="relative">
									<div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300"></div></div>
									<div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">ou</span></div>
								</div>

								<Button onClick={iniciarCamera} variant="outline" className="w-full h-14 text-lg border-2"><Camera className="w-6 h-6 mr-2"/>Usar Câmera</Button>
							</div>

							{ativos.length > 0 && (
								<div className="mt-8 pt-6 border-t">
									<p className="text-sm font-semibold text-slate-600 mb-3">ACESSO RÁPIDO</p>
									<div className="space-y-2 max-h-48 overflow-y-auto">{(ativos as any[]).slice(0,5).map(ativo => (
										<Button key={ativo.id} variant="ghost" onClick={() => { setAtivoAtual(ativo); setEtapa('detalhes'); }} className="w-full justify-start text-left h-auto py-3">
											<div className="flex items-center gap-3 w-full"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><QrCode className="w-5 h-5 text-blue-600"/></div><div className="flex-1 min-w-0"><p className="font-semibold text-slate-900">{ativo.asset_code}</p><p className="text-xs text-slate-500 truncate">{ativo.asset_type}</p></div></div>
										</Button>
									))}</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

			{showCamera && (
					<div className="fixed inset-0 bg-black z-50 flex flex-col">
						<div className="flex-1 relative">
							<video 
								ref={videoRef} 
								autoPlay 
								playsInline 
								muted 
								className="w-full h-full object-cover"
								style={{ transform: 'scaleX(-1)' }}
							/>
							<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
								<div className="w-64 h-64 border-4 border-white rounded-2xl shadow-lg"></div>
							</div>
						</div>
						<div className="p-6 bg-black">
							<p className="text-white text-center mb-4">Posicione o QR Code no quadrado</p>
							<Button onClick={pararCamera} variant="outline" className="w-full">
								Fechar Câmera
							</Button>
							<p className="text-xs text-center text-gray-400 mt-2">
								Use a busca manual para continuar
							</p>
						</div>
					</div>
				)}
			</div>
			</Layout>
		);
	}

	if (etapa === 'detalhes' && ativoAtual) {
		return (
			<Layout>
			<div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-900 p-4">
				<div className="max-w-md mx-auto">
					<div className="flex items-center gap-3 mb-6 text-white"><Button onClick={resetarScanner} variant="ghost" size="icon" className="text-white hover:bg-white/20"><ArrowLeft className="w-6 h-6"/></Button><div><h1 className="text-2xl font-bold">Ativo Encontrado</h1><p className="text-green-100">Selecione uma ordem para executar</p></div></div>

					<Card className="bg-white shadow-2xl border-none mb-4"><CardContent className="p-6"><div className="flex items-start justify-between mb-4"><div><p className="text-3xl font-bold text-slate-900 mb-1">{ativoAtual.asset_code}</p><p className="text-slate-600">{ativoAtual.name || ativoAtual.asset_type}</p></div><Badge className={`${ativoAtual.operational_status === 'operacional' ? 'bg-green-500' : 'bg-red-500'} text-white`}>{ativoAtual.operational_status}</Badge></div><div className="space-y-4 pt-4 border-t"><div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-blue-600 mt-0.5" /><div><p className="text-sm text-slate-500">Localização</p><p className="font-semibold text-slate-900">{ativoAtual.location}</p>{ativoAtual.sector && <p className="text-sm text-slate-600">{ativoAtual.sector}</p>}</div></div><div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-slate-500">Tipo</p><p className="font-medium text-slate-900">{ativoAtual.asset_type}</p></div><div><p className="text-sm text-slate-500">Capacidade</p><p className="font-medium text-slate-900">{ativoAtual.capacity || '-'}</p></div></div>{(ativoAtual.checklist_personalizado || ativoAtual.checklist_template_id) && (<div className="pt-4 border-t"><Badge className="bg-purple-500"><CheckCircle className="w-3 h-3 mr-1"/>Checklist Configurado</Badge>{ativoAtual.checklist_personalizado && (<p className="text-xs text-slate-500 mt-1">{ativoAtual.checklist_personalizado.itens?.length || 0} itens personalizados</p>)}</div>)}</div></CardContent></Card>

					{osAbertas.length > 0 ? (
						<div className="space-y-3 mb-4"><div className="flex items-center gap-2 text-white"><AlertTriangle className="w-5 h-5"/><h2 className="font-bold text-lg">Ordens em Aberto ({osAbertas.length})</h2></div>{osAbertas.map((os: any) => (<Card key={os.id} className="bg-white shadow-lg border-none"><CardContent className="p-4"><div className="flex items-start justify-between mb-3"><div><p className="font-bold text-slate-900">{os.order_number}</p><p className="text-sm text-slate-600">{os.order_type === 'preventiva' ? 'Preventiva' : 'Corretiva'}</p></div><Badge className={os.status === 'em_andamento' ? 'bg-blue-500' : 'bg-orange-500'}>{os.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'}</Badge></div>{os.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{os.description}</p>}{os.scheduled_date && <div className="flex items-center gap-2 text-sm text-slate-500 mb-3"><CalendarIcon className="w-4 h-4"/><span>Previsto: {safeFormatDate(os.scheduled_date, 'dd/MM/yyyy')}</span></div>}<Button onClick={() => handleIniciarOS(os)} className="w-full bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-2"/>{os.status === 'em_andamento' ? 'Continuar Manutenção' : 'Iniciar Manutenção'}</Button></CardContent></Card>))}</div>
					) : (
						<Card className="bg-white/10 border-2 border-white/20 backdrop-blur-lg mb-4"><CardContent className="p-6 text-center"><CheckCircle className="w-12 h-12 text-white mx-auto mb-3 opacity-50" /><p className="text-white font-medium mb-1">Nenhuma OS em Aberto</p><p className="text-white/70 text-sm">Todas as manutenções estão em dia</p></CardContent></Card>
					)}

					<Button onClick={handleAbrirOSCorretiva} className="w-full h-16 bg-red-600 hover:bg-red-700 text-white shadow-xl mb-4"><AlertTriangle className="w-6 h-6 mr-2"/><div className="text-left"><p className="font-bold">Abrir Manutenção Corretiva</p><p className="text-xs text-red-100">Problema identificado agora</p></div></Button>

					{osHistorico.length > 0 && (<Card className="bg-white shadow-lg border-none"><CardContent className="p-6"><h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-slate-600"/>Histórico Recente</h3><div className="space-y-3 max-h-48 overflow-y-auto">{osHistorico.map((os: any) => (<div key={os.id} className="p-3 bg-green-50 rounded-lg border border-green-200"><div className="flex justify-between items-start mb-1"><p className="font-medium text-sm text-slate-900">{os.order_number}</p><Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1"/>Concluída</Badge></div><p className="text-xs text-slate-600">{safeFormatDate(os.completed_date || os.created_at, 'dd/MM/yyyy')}</p></div>))}</div></CardContent></Card>)}
				</div>
			</div>
			</Layout>
		);
	}

	if (etapa === 'checklist' && checklistAtual && osAtual) {
		return (
			<Layout>
			<div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-4"><div className="max-w-2xl mx-auto"><div className="flex items-center gap-3 mb-6 text-white"><Button onClick={() => setEtapa('detalhes')} variant="ghost" size="icon" className="text-white hover:bg-white/20"><ArrowLeft className="w-6 h-6"/></Button><div><h1 className="text-2xl font-bold">OS: {osAtual.order_number}</h1><p className="text-purple-100">{checklistAtual.name || checklistAtual.nome}</p></div></div><ChecklistExecucao checklist={checklistAtual} ativo={ativoAtual} onSalvar={handleSalvarChecklist} onVoltar={() => setEtapa('detalhes')} /></div></div>
			</Layout>
		);
	}

	if (etapa === 'finalizar') {
		return (
			<Layout>
			<div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-900 p-4"><div className="max-w-md mx-auto"><div className="text-center mb-8 pt-8"><div className="w-20 h-20 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-white"/></div><h1 className="text-3xl font-bold text-white mb-2">Manutenção Concluída!</h1><p className="text-green-100">OS finalizada com sucesso</p></div><Card className="bg-white shadow-2xl border-none mb-6"><CardContent className="p-6 space-y-4"><div className="bg-green-50 border border-green-200 rounded-lg p-4"><div className="flex items-center gap-2 text-green-800 mb-2"><CheckCircle className="w-5 h-5"/><p className="font-bold">OS Concluída</p></div><p className="text-sm text-green-700 mb-1"><strong>OS:</strong> {osAtual?.order_number}</p><p className="text-sm text-green-700 mb-1"><strong>Equipamento:</strong> {ativoAtual?.asset_code}</p><p className="text-sm text-green-700"><strong>Checklist:</strong> {checklistAtual?.name || checklistAtual?.nome}</p><p className="text-xs text-green-600 mt-2">Data: {safeFormatDate(new Date(), 'dd/MM/yyyy HH:mm')}</p></div><Button onClick={resetarScanner} className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700"><CheckCircle className="w-6 h-6 mr-2"/>Escanear Próximo Ativo</Button></CardContent></Card></div></div>
			</Layout>
		);
	}

	return null;
}
