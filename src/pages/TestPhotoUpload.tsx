import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TestPhotoUpload() {
  const navigate = useNavigate();
  const [assetId, setAssetId] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleUpload = async () => {
    if (!file || !assetId) {
      setMessage('❌ Selecione uma foto e um asset ID');
      return;
    }

    setLoading(true);
    try {
      // Upload to storage
      const filePath = `test-photos/${assetId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('checklist-photos')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        setMessage(`❌ Erro no upload: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      // Get public URL
      const { data: publicData } = supabase.storage.from('checklist-photos').getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl;

      if (!publicUrl) {
        // Try signed URL
        const { data: signedData } = await supabase.storage.from('checklist-photos').createSignedUrl(filePath, 60 * 60);
        if (signedData?.signedUrl) {
          setPhotoUrl(signedData.signedUrl);
          setMessage(`✅ URL Assinada (1h): ${signedData.signedUrl}`);
        } else {
          setMessage('❌ Não consegui obter URL pública ou assinada');
          setLoading(false);
          return;
        }
      } else {
        setPhotoUrl(publicUrl);
        setMessage(`✅ URL Pública: ${publicUrl}`);
      }

      // Now add to asset_history
      if (workOrderId) {
        const { error: updateError } = await supabase
          .from('asset_history')
          .update({ photos: [publicUrl || photoUrl] })
          .eq('work_order_id', workOrderId);

        if (updateError) {
          setMessage(`⚠️ Upload OK, mas erro ao atualizar asset_history: ${updateError.message}`);
        } else {
          setMessage(`✅ Foto enviada e salva no banco! URL: ${publicUrl || photoUrl}`);
        }
      } else {
        setMessage(`✅ Foto enviada ao Storage! URL: ${publicUrl || photoUrl}\n\nCopie a URL acima e adicione manualmente ao campo photos da tabela asset_history.`);
      }
    } catch (err) {
      setMessage(`❌ Erro: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToDatabase = async () => {
    if (!photoUrl || !assetId) {
      setMessage('❌ Insira a URL da foto e o asset ID');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('asset_history')
        .insert({
          asset_id: assetId,
          work_order_id: workOrderId || null,
          action_type: 'inspecao',
          description: 'Foto de teste',
          photos: [photoUrl],
          created_at: new Date().toISOString(),
        });

      if (error) {
        setMessage(`❌ Erro ao salvar: ${error.message}`);
      } else {
        setMessage('✅ Foto adicionada ao banco de dados!');
      }
    } catch (err) {
      setMessage(`❌ Erro: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="text-3xl font-bold">Upload de Foto de Teste</h1>
        <p className="text-muted-foreground">Ferramenta para testar upload e visualização de fotos</p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> Enviar Foto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Asset ID (obrigatório)</label>
              <Input
                placeholder="Cole o UUID do ativo aqui (ex: a1b2c3d4-...)"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Work Order ID (opcional)</label>
              <Input
                placeholder="Cole o UUID da ordem de serviço (opcional)"
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Selecione uma Foto</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="border rounded-lg p-2 w-full"
              />
            </div>

            {preview && (
              <div>
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img src={preview} alt="preview" className="w-full max-w-xs h-auto rounded border" />
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || !assetId || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Enviando...' : '📤 Enviar Foto para Storage'}
            </Button>

            {message && (
              <div className="border rounded-lg p-4 bg-muted/20 whitespace-pre-wrap text-sm">
                {message}
              </div>
            )}

            {photoUrl && !workOrderId && (
              <>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Ou adicione ao banco diretamente:</p>
                  <Button
                    onClick={handleAddToDatabase}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    ✅ Adicionar ao Banco de Dados
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Passo 1: Copie um Asset ID</p>
              <p className="text-muted-foreground">Vá para a página de um ativo e copie o UUID da URL ou do banco</p>
            </div>
            <div>
              <p className="font-medium">Passo 2: Cole aqui</p>
              <p className="text-muted-foreground">Cole o Asset ID acima e selecione uma foto</p>
            </div>
            <div>
              <p className="font-medium">Passo 3: Envie</p>
              <p className="text-muted-foreground">Clique em "Enviar Foto" — a foto será enviada ao Storage</p>
            </div>
            <div>
              <p className="font-medium">Passo 4: Visualize</p>
              <p className="text-muted-foreground">Volte para o Histórico do Ativo e clique na manutenção — a foto deve aparecer</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
