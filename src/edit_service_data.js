import React, { useState, useEffect } from "react";
import logo from "./assets/imgs/icon_black.png";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { addServicoInfo, uploadImage } from "./database";
import { isAuthenticated } from "./database";
import { get_info } from "./database";

const EditService = () => {
  const [inputs, setInputs] = useState([]);
  const [photos, setPhotos] = useState([]); // Estado para armazenar as URLs das fotos
  const navigate = useNavigate();
  const { userId, doc } = useParams();
  const [loading, setLoading] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isUserAuthenticated = await isAuthenticated();
        if (!isUserAuthenticated) navigate("/login");
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        navigate("/login");
      } finally {
        setLoadingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!doc) return;
    const fetchData = async () => {
      try {
        const data = await get_info(doc);
        setInputs(data.servico_json ? JSON.parse(data.servico_json) : []);
        setPhotos(data.portifolio_imgs ? JSON.parse(data.portifolio_imgs) : []);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar informações:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [doc]);

  useEffect(() => {
    document.title = 'Serviços';
  }, []);

  if (loadingAuth) return <div>Carregando...</div>;

  const addInput = () => {
    setInputs([...inputs, { id: Date.now(), nome: "", preco: "", duracao: "" }]);
  };

  const removeInput = (id) => {
    setInputs(inputs.filter((input) => input.id !== id));
  };

  const handleChange = (id, field, value) => {
    setInputs(inputs.map((input) => input.id === id ? { ...input, [field]: value } : input));
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = files
      .filter(file => !photos.some(photo => photo.includes(file.name)))
      .map(file => URL.createObjectURL(file));
    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const uploadedPhotoUrls = await Promise.all(
      photos.filter(photo => photo.startsWith("blob:"))
        .map(async (photo) => {
          const file = await fetch(photo).then(res => res.blob());
          return uploadImage(doc, file);
        })
    );

    const allPhotos = [...photos.filter(photo => !photo.startsWith("blob:")), ...uploadedPhotoUrls];
    const service_json = JSON.stringify(inputs);
    const photos_json = JSON.stringify(allPhotos);

    try {
      await addServicoInfo(doc, service_json, photos_json);
      navigate(`/${userId}/${doc}/edit-last-editions`);
    } catch (e) {
      console.error("Erro ao enviar dados:", e);
    }
  };

  return (
    <div className="form_info">
      <form onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" style={{ width: "20%" }} />
        <h1>Serviços:</h1>
        <div className="servicos">
          {inputs.map((input) => (
            <div className="item_servico" key={input.id}>
              <input type="text" value={input.nome} onChange={(e) => handleChange(input.id, "nome", e.target.value)} placeholder="Serviço..." />
              <input type="number" value={input.preco} onChange={(e) => handleChange(input.id, "preco", e.target.value)} placeholder="Preço..." />
              <input type="number" value={input.duracao} onChange={(e) => handleChange(input.id, "duracao", e.target.value)} placeholder="Duração (min)..." />
              <button type="button" onClick={() => removeInput(input.id)}>Remover</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addInput}>Adicionar Serviço</button>
        <h1>Portifólio:</h1>
        <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} />
        <div className="gallery">
          {photos.map((photo, index) => (
            <div key={index} className="photo-wrapper" style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
              <img src={photo} alt="Preview" className="photo" />
              <button style={{width: "2em", height: "2em", backgroundColor: "red", color: "white", border: "none"}} type="button" onClick={() => removePhoto(index)}>X</button>
            </div>
          ))}
        </div>
        <button type="submit">Próximo</button>
      </form>
    </div>
  );
};

export default EditService;
