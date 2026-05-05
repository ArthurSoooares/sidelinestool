import { useState, useEffect } from "react";

// ─── URL da API ────────────────────────────────────────────────────────────────
const API = "https://sidelinestool.onrender.com";

function App() {

  // ─── Estados — Fluxo Principal ──────────────────────────────────────────────
  const [produtos, setProdutos] = useState(null);   // arquivo de produtos
  const [rotas, setRotas] = useState(null);         // arquivo de rotas
  const [tbrs, setTbrs] = useState("");             // códigos TBR colados
  const [loading, setLoading] = useState(false);    // botão processar

  // ─── Estados — Modal ────────────────────────────────────────────────────────
  const [previewData, setPreviewData] = useState(null);  // dados do preview ou blob do resultado
  const [showModal, setShowModal] = useState(false);
  const [modoModal, setModoModal] = useState(null);      // "preview" ou "download"

  // ─── Estado — Status da API ─────────────────────────────────────────────────
  const [apiStatus, setApiStatus] = useState("verificando"); // "verificando" | "online" | "offline"

  // ─── Verifica status da API ao carregar e a cada 30s ────────────────────────
  useEffect(() => {
    const verificar = async () => {
      try {
        const res = await fetch(`${API}/status`, { signal: AbortSignal.timeout(5000) });
        setApiStatus(res.ok ? "online" : "offline");
      } catch {
        setApiStatus("offline");
      }
    };
    verificar();
    const intervalo = setInterval(verificar, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // ─── Função — Processar e gerar Excel ───────────────────────────────────────
  const enviar = async () => {
    if (!produtos || !rotas) {
      alert("Envie os dois arquivos!");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("produtos", produtos);
    formData.append("rotas", rotas);
    formData.append("tbrs", tbrs);

    try {
      const res = await fetch(`${API}/processar`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Erro ao processar");
      const blob = await res.blob();
      setPreviewData(blob);
      setModoModal("download");
      setShowModal(true);
    } catch (err) {
      alert("Erro: " + err.message);
    }
    setLoading(false);
  };

  // ─── Função — Baixar arquivo gerado ─────────────────────────────────────────
  const baixar = () => {
    if (!previewData) return;
    const url = window.URL.createObjectURL(previewData);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resultado.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setShowModal(false);
  };

  // ─── Função — Gerar preview sem tradução ────────────────────────────────────
  const verPreview = async () => {
    if (!produtos || !rotas) {
      alert("Envie os dois arquivos primeiro!");
      return;
    }
    const formData = new FormData();
    formData.append("produtos", produtos);
    formData.append("rotas", rotas);
    formData.append("tbrs", tbrs);

    try {
      const res = await fetch(`${API}/preview`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Erro ao gerar preview");
      const data = await res.json();
      setPreviewData(data);
      setModoModal("preview");
      setShowModal(true);
    } catch (err) {
      console.error(err);
      alert("Erro: " + err.message);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

      {/* ── MODAL ─────────────────────────────────────────────────────────────── */}
      {showModal && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col">

            {/* Cabeçalho do modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {modoModal === "preview" ? "Preview do Resultado" : "Arquivo Pronto!"}
                </h2>
                <p className="text-xs text-slate-400">
                  {modoModal === "preview"
                    ? `${previewData.total_easy_ship} Easy Ship · ${previewData.total_seller_flex} Seller Flex · sem tradução`
                    : "O processamento foi concluído com sucesso."}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
                <span className="material-icons text-slate-500 text-sm">close</span>
              </button>
            </div>

            {/* Conteúdo do modal — tabelas (preview) ou confirmação (download) */}
            {modoModal === "preview" ? (
              <div className="overflow-auto flex-1 px-6 py-4 flex flex-col gap-8">

                {/* Tabela Easy Ship */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    Easy Ship
                    <span className="text-xs font-normal text-slate-400">({previewData.total_easy_ship} registros)</span>
                  </h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        {previewData.headers.map((h, i) => (
                          <th key={i} className="text-left px-3 py-2 font-bold text-slate-600 border border-slate-200 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.easy_ship.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 border border-slate-200 text-slate-700 whitespace-nowrap">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tabela Seller Flex */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span>
                    Seller Flex
                    <span className="text-xs font-normal text-slate-400">({previewData.total_seller_flex} registros)</span>
                  </h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        {previewData.headers.map((h, i) => (
                          <th key={i} className="text-left px-3 py-2 font-bold text-slate-600 border border-slate-200 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.seller_flex.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 border border-slate-200 text-slate-700 whitespace-nowrap">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              /* Tela de confirmação após processar */
              <div className="px-6 py-8 flex flex-col items-center gap-4 flex-1 justify-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <span className="material-icons text-green-500 text-3xl">check_circle</span>
                </div>
                <p className="text-slate-600 text-sm text-center">
                  O arquivo foi gerado com duas abas — Easy Ship e Seller Flex. Clique em baixar para salvar.
                </p>
              </div>
            )}

            {/* Rodapé do modal — botões */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                Fechar
              </button>
              {modoModal === "download" && (
                <button onClick={baixar} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800">
                  <span className="material-icons text-sm">download</span>
                  Baixar XLSX
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <header className="max-w-6xl mx-auto px-6 py-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
            <span className="material-icons text-white text-sm">architecture</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">SideLine Tool</span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 border border-slate-200 px-3 py-1.5 rounded-full bg-white">
          V1.2.0
        </div>
      </header>

      {/* ── MAIN ──────────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 pb-20">

        {/* Título da página */}
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Processador de Logística</h1>
          <p className="text-slate-500 text-lg">Gerencie e automatize o fluxo de processamento de rotas e produtos com precisão técnica.</p>
        </div>

        {/* ── CARDS DE UPLOAD ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          {/* Card — Arquivo de Produtos */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
              <span className="material-icons text-slate-600">inventory_2</span>
            </div>
            <div className="absolute top-8 right-8 text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded">REQUERIDO</div>
            <h3 className="text-xl font-bold mb-2">Arquivo de Produtos</h3>
            <p className="text-sm text-slate-400 mb-6">Importe a planilha base de SKUs e dimensões logísticas.</p>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="file" className="hidden" onChange={(e) => setProdutos(e.target.files[0])} />
              <span className="material-icons text-slate-300 mb-2">cloud_upload</span>
              <span className="text-xs font-medium text-slate-500">{produtos ? produtos.name : "Selecionar CSV ou XLSX"}</span>
            </label>
          </div>

          {/* Card — Arquivo de Rotas */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
              <span className="material-icons text-slate-600">alt_route</span>
            </div>
            <div className="absolute top-8 right-8 text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded">REQUERIDO</div>
            <h3 className="text-xl font-bold mb-2">Arquivo de Rotas</h3>
            <p className="text-sm text-slate-400 mb-6">Dados de destinos, janelas de entrega e prioridades.</p>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="file" className="hidden" onChange={(e) => setRotas(e.target.files[0])} />
              <span className="material-icons text-slate-300 mb-2">map</span>
              <span className="text-xs font-medium text-slate-500">{rotas ? rotas.name : "Selecionar CSV ou XLSX"}</span>
            </label>
          </div>

          {/* Card — Códigos TBR */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="material-icons text-white text-sm">terminal</span>
              </div>
              <h3 className="text-lg font-bold">Códigos TBR</h3>
            </div>
            <p className="text-[10px] font-bold text-cyan-600 mb-3 tracking-widest uppercase">Entrada de Parâmetros</p>
            <textarea
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono resize-none focus:ring-2 focus:ring-slate-200 outline-none"
              placeholder="Insira os códigos TBR (um por linha)..."
              value={tbrs}
              onChange={(e) => setTbrs(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
              <span className="material-icons text-[12px]">info</span> Máximo de 500 códigos.
            </p>
          </div>

        </div>

        {/* ── BANNER DE VALIDAÇÃO ───────────────────────────────────────────────── */}
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-center gap-4 mb-10">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
            <span className="material-icons text-white">verified</span>
          </div>
          <div>
            <h4 className="font-bold text-blue-900">Validação Ativa</h4>
            <p className="text-sm text-blue-700">O sistema processa os dados utilizando algoritmos de otimização para garantir o melhor fluxo logístico.</p>
          </div>
        </div>

        {/* ── RODAPÉ FIXO ───────────────────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 py-6 z-50">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

            {/* Status da API */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus === "online" ? "bg-green-500 animate-pulse" :
                  apiStatus === "offline" ? "bg-red-400" :
                  "bg-yellow-400 animate-pulse"
                }`}></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {apiStatus === "online" ? "API Online" :
                   apiStatus === "offline" ? "API Offline" :
                   "Iniciando..."}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-900">Status: </span>
                {produtos && rotas ? "2/2 arquivos selecionados" : "0/2 arquivos selecionados"}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-4">
              <button
                onClick={verPreview}
                disabled={!produtos || !rotas}
                className="px-6 py-3 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Visualizar Preview
              </button>
              <button
                onClick={enviar}
                disabled={loading || !produtos || !rotas}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-xl active:scale-95 ${
                  loading || !produtos || !rotas
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {loading ? (
                  <>
                    <span className="material-icons animate-spin text-sm">sync</span>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>Processar e Baixar</span>
                    <span className="material-icons text-sm">download</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
