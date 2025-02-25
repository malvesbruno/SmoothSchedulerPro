import React, { useState, useEffect } from "react";
import logo from "./assets/imgs/icon_black.png";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { addServicoInfo, uploadImage } from "./database";
import { isAuthenticated } from "./database";

const FormService = () => {
  const [inputs, setInputs] = useState([]);
  const [photos, setPhotos] = useState([]); // Estado para armazenar as fotos
  const navigate = useNavigate();
  const { userId } = useParams();
  const { doc } = useParams();
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isUserAuthenticated = await isAuthenticated();
        if (!isUserAuthenticated) {
          navigate("/login"); // Redireciona para a página de login
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        navigate("/login"); // Redireciona em caso de erro
      } finally {
        setLoadingAuth(false); // Finaliza o estado de carregamento
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    document.title = 'Serviços';
  }, []);

  if (loadingAuth) {
    return <div>Carregando...</div>; // Tela de carregamento enquanto verifica autenticação
  }

  // Função para adicionar um novo input
  const addInput = () => {
    setInputs([...inputs, { id: Date.now(), nome: "", preco: "", duracao: "" }]);
  };

  // Função para remover um input pelo ID
  const removeInput = (id) => {
    setInputs(inputs.filter((input) => input.id !== id));
  };

  // Função para atualizar um campo específico do serviço
  const handleChange = (id, field, value) => {
    setInputs(inputs.map((input) => 
      input.id === id ? { ...input, [field]: value } : input
    ));
  };

  // Função para carregar fotos
  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files); // Converte FileList em array
    const newPhotos = files.map((file) => ({
      id: Date.now() + Math.random(), // Gera um ID único
      file,
      url: URL.createObjectURL(file), // Cria uma URL temporária para exibir a imagem
    }));
    setPhotos([...photos, ...newPhotos]); // Adiciona as novas fotos ao estado
  };

  // Função para remover uma foto pelo ID
  const removePhoto = (id) => {
    setPhotos(photos.filter((photo) => photo.id !== id)); // Remove a foto do estado
  };

  // Função para submeter o formulário
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Upload das fotos para o servidor
    const uploadedPhotoUrls = await Promise.all(
      photos.map(async (photo) => {
        const url = await uploadImage(doc, photo.file); // Usa a função uploadImage
        return url;
      })
    );

    // Prepara os dados para enviar ao servidor
    const service_json = JSON.stringify(inputs);
    const photos_json = JSON.stringify(uploadedPhotoUrls);

    try {
      await addServicoInfo(doc, service_json, photos_json);
      navigate(`/${userId}/${doc}/last-editions`);
    } catch (e) {
      console.error("Erro ao enviar dados:", e);
    }
  };

  return (
    <div className="form_info">
      <form onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" style={{ width: "20%" }} />
        <h1>Serviços:</h1>

        {/* Lista de serviços cadastrados */}
        <div>
          {inputs.map((input) => (
            <div key={input.id} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <input
                type="text"
                value={input.nome}
                onChange={(e) => handleChange(input.id, "nome", e.target.value)}
                style={{ height: "2em" }}
                placeholder="Serviço..."
              />
              <input
                type="number"
                value={input.preco}
                onChange={(e) => handleChange(input.id, "preco", e.target.value)}
                style={{ height: "2em" }}
                placeholder="Preço..."
              />
              <input
                type="number"
                value={input.duracao}
                onChange={(e) => handleChange(input.id, "duracao", e.target.value)}
                style={{ height: "2em" }}
                placeholder="Duração (min)..."
              />
              <button type="button" style={{ margin: "0.3em" }} onClick={() => removeInput(input.id)}>
                Remover
              </button>
            </div>
          ))}
        </div>

        {/* Botão para adicionar um novo serviço */}
        <button type="button" onClick={addInput} style={{ marginBottom: "10px" }}>
          Adicionar Serviço
        </button>

        {/* Seção para carregar e exibir fotos */}
        <h1>Portifólio</h1>
        <div className="input_carrosel" style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column"}}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            style={{ marginBottom: "10px" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {photos.map((photo) => (
              <div key={photo.id} style={{ position: "relative" }}>
                <img
                  src={photo.url}
                  alt="Preview"
                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                />
                <button
                  type="button"
                  style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                  onClick={() => removePhoto(photo.id)}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Botão de submissão do formulário */}
        <button type="submit">Próximo</button>
      </form>
    </div>
  );
};

export default FormService;