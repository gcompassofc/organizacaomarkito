// Dados de exemplo da OPA Imóveis extraídos do protótipo HTML (Organizador offline).
// Usados pela importação one-shot: posts do cronograma (com data, tipo, título,
// horário/nota, link e legenda) e as gavetas por imóvel. Fiel ao HTML original.

const B = 'https://opailhabela-my.sharepoint.com/:f:/g/personal/atendimento_opailhabela_com_br/';
const L = (s) => B + s;

// ── Legendas longas (idênticas ao HTML) ──
const legSiriuba = 'Exemplo de legenda para este post. Aqui você pode colocar o texto que quiser. O limite é a sua imaginação e os 2200 caracteres do Instagram!';

const legPra = `CASA À VENDA – ENGENHO D'ÁGUA | ILHABELA

Voltamos para filmar essa casa de dia porque a luz muda completamente a leitura do imóvel.

* Casa nova, construída do zero
* Arquitetura contemporânea
* Área social integrada
* Cozinha, jantar e estar no mesmo ambiente
* 1 suíte no pavimento principal
* 3 suítes no pavimento inferior
* Vista para o mar
* Imóvel mobiliado e porteira fechada
* Matrícula regularizada

Valor: R$ 8.500.000
Engenho D'Água | Ilhabela/SP

Uma casa que entrega vista, luz natural e uma planta pensada para viver Ilhabela com mais praticidade.

No próximo vídeo, mostramos melhor como essa distribuição funciona no dia a dia.`;

const legSpoiler = `Algumas casas pedem mais de um olhar.

Não é só sobre a vista.
Nem só sobre a arquitetura.
Nem só sobre estar pronta.

É o conjunto.

A luz que muda ao longo do dia.
A área social integrada.
A leitura mais contemporânea.
O gourmet separado da casa principal.
A vista para o mar sem perder a praticidade do Engenho d'Água.

Essa é uma casa nova, mobiliada e porteira fechada em Ilhabela.

E ainda vamos mostrar mais detalhes dela por aqui.

Nos siga para acompanhar mais desse imóvel.`;

const legP1 = `Essa casa tem uma coisa que aparece melhor no vídeo do que na ficha técnica: luz.

A luz entra pela sala, atravessa os caixilhos do piso ao teto, muda com a nuvem, com o horário, com o pôr do sol.

E a casa acompanha isso muito bem.

Alguns pontos que fazem diferença aqui:

• Área social integrada com cozinha, jantar, estar e TV
• Grandes aberturas do piso ao teto
• Suíte no pavimento principal
• Vista para o mar com pouca subida no Engenho d'Água

Para quem gosta de uma arquitetura mais contemporânea, clean e aberta, essa casa faz muito sentido.

No próximo vídeo, a gente desce para mostrar as três suítes.

Manda um OPA se quiser conhecer essa casa de perto.`;

const legP2 = `Uma vista incrível.

Era fim de tarde, a luz estava entrando de um jeito bonito e dava para sentir melhor o que essa casa entrega.

No andar de baixo, ficam as três suítes.

• Todas com vista para o mar
• Marcenaria em todos os ambientes
• Cortinas blackout
• Banheiros com box piso-teto

É uma divisão inteligente.

Em cima, a vida principal acontece com facilidade.
Embaixo, família e convidados ficam bem acomodados, com privacidade e conforto.

No próximo vídeo, vamos para a área de lazer: piscina, gourmet e fim de tarde.

Acompanha a sequência para ver o restante.`;

const legP3 = `Essa área Gourmet vai além...

Ela fica separada da parte íntima, mas continua conectada com a arquitetura, com a vista e com o jeito de viver da casa.

• Piscina com vista para o mar
• Gourmet completo e climatizado
• Mesa interna, mesa externa e bancada ampla
• Churrasqueira, geladeira e cervejeira

Não precisa trazer a casa inteira para a área de lazer.

O encontro acontece aqui.

Com a família.
Com amigos.
No calor do verão.
Ou numa noite mais fria, com Ilhabela acesa lá embaixo.

Essa casa no Engenho d'Água não é só bonita para gravar.

Ela funciona para viver.

Gostou? Manda um OPA e vem conhecer comigo.`;

const legMoraria = `Tem detalhes que mostram muito sobre uma casa.

A cortina subindo, a luz entrando e a vista aparecendo aos poucos dizem bastante sobre o que é viver aqui.

Essa casa no Engenho d'Água tem uma proposta mais contemporânea, clean e integrada, diferente da arquitetura mais rústica que costuma aparecer em Ilhabela.

* Vista ampla para o mar
* Área social integrada com jantar, estar e cozinha
* Grandes aberturas do piso ao teto
* Venezianas automatizadas e muita luz natural

É uma casa nova, mobiliada e porteira fechada, pensada para quem quer viver Ilhabela com conforto, praticidade e uma estética mais atual.

Você moraria em uma casa assim em Ilhabela?

Manda um OPA para conhecer mais detalhes.`;

const legSurp = `A gente já tinha vindo nessa casa.

E mesmo assim, a vista surpreende de novo.

A sala tem uma entrada de luz muito bonita, uma fachada de vidro ampla e uma leitura aberta para o mar, para a Vila e para o campo da aviação.

É aquele tipo de casa em que a paisagem não fica do lado de fora.

Ela entra.

* Vista ampla para o mar
* Fachada de vidro com muita luz natural
* Cortinas automatizadas
* Localização perto da avenida, com horizonte aberto

Essa é uma das combinações mais difíceis de encontrar em Ilhabela: estar perto do plano da cidade e, ao mesmo tempo, ter uma vista desse tamanho.

Quer conhecer esse imóvel?

Manda um OPA.`;

const legFilm = `Tem vista que, à noite, muda completamente a sensação da casa.

Aqui, o canal aparece iluminado, a Vila ao fundo, o movimento da cidade acontecendo lá embaixo e a casa toda acesa por dentro.

O mais interessante é que essa casa está muito perto da avenida.

Você sobe pouco, mas ganha um horizonte enorme de vista porque ela fica na primeira parte alta do Engenho d'Água.

* Vista noturna para o canal e para a Vila
* Casa nova e contemporânea
* Ambientes integrados
* Automação, iluminação, som e tecnologia embarcada

Por dentro, a casa segue a mesma proposta: muita luz, marcenaria completa, eletrodomésticos, cortinas automatizadas e uma área social totalmente integrada.

É uma casa que entrega vista, tecnologia e praticidade no mesmo lugar.

Quer conhecer esse imóvel?

Manda um OPA.`;

const mk = (type, title, extra = {}) => ({ type, title, note: '', link: '', linkLabel: 'Ver materiais', legenda: '', ...extra });

// Semanas do HTML: start (segunda) + array de 7 dias, cada dia é uma lista de posts.
const WEEKS = [
  { start: '2026-06-29', days: [
    [ mk('Estático', 'Bom dia OPA'), mk('Ads · Reels', 'Siriúba C1', { note: 'Postar antes do jogo, pela manhã', link: L('IgCwHjJBNdzFR5qb2586IwNAAQ3O3LR1hP6engN8jd2-Jlo?e=AGYVLb'), legenda: legSiriuba }) ],
    [ mk('Takes', 'Takes - COCAIA - CA006833', { note: '18h', link: L('IgBlJ7U3XeavRpJK-v703yy4AWn6oEZ3lUIMrngszXYeGKU?e=AKYmpv') }), mk('Reels', 'Ilhabela tem uma semana mágica que 90% perde', { note: '15h' }) ],
    [ mk('Reels', 'Itaguaçu (4823 - Editado)', { note: '12h' }), mk('Carrossel', 'Quanto Custa Manter uma Casa', { note: '15h · Artigo da June' }), mk('Reels Motion', 'Eventos de Julho', { note: '18h' }) ],
    [ mk('Carrossel', 'Engenho - CA006940', { note: '15h', link: L('IgAUkcx5jCsiSIxwClAj8XhgAcIXqTIil5ZUdsakWM2KCOE?e=fpIqzP') }), mk('Reels', 'Siriúba - C4', { note: '18h', link: L('IgAX9UFoXwfeToK4GaoNEulgAfkkn8EYnuHc-B9b6ax0BDU?e=VzVrdA') }) ],
    [ mk('Reels', 'Quando eu era criança', { note: '12h', link: L('IgCXEyOnJfmRSr94TQxnvT5PAWlKJ1nX8goYgOE34gueG9s?e=U4mqRb') }) ],
    [ mk('Reels', 'Refação do vídeo 1,5M', { note: '12h', link: L('IgDRLOOGiyZDTo0bb7kt9lQmAc57BSwgHH-XNGhH_tf-ccI?e=BFgdEd') }) ],
    [ mk('Reels', 'Estamos chegando na semana da vela', { note: '15h', link: 'https://drive.google.com/file/d/14xAmCEkLf2wheJIEVPHjwlOu_x74NagW/view?usp=drive_link', linkLabel: 'Ver vídeo' }) ]
  ]},
  { start: '2026-07-06', days: [
    [ mk('Reels', 'PERMUTA (Engenho CA006944)', { note: '16h', link: L('IgAdpRrxn-0PTaNQR_UV6a92AVMMkGEQ659M8-jgYe5Fbig?e=IRMMZo') }), mk('Reels', 'Cocaia Chácara PT 1', { note: '19h', link: L('IgAqN_7T0mzKS5EEDGMsLhxQAbZkMGUwWrMc1q6PI-x-WKA?e=HtAoJT') }) ],
    [ mk('Reels', 'Você tá visitando Ilhabela na hora errada', { note: '15h', link: L('IgCP9Dalkt9vSY9aAMJkcyOLAZZXdjJLyeSqAQ0DOF9m6lQ?e=ICv0Nd') }), mk('Stories', 'Repost da Vela + Chamada para artigo', { note: '15h' }), mk('Reels', 'Cocaia Chácara PT 2', { note: '18h', link: L('IgChGy__AoWJSINzs44o-tASAUyQFVDEbjAYnwvhZosVJrw?e=po4TgK') }) ],
    [ mk('Reels', 'Cocaia - PT 3', { note: '15h', link: L('IgB_nbaDKLP8Qbyehx6gTfPuAWJbNJbk4VULRaea7Qkwmp4?e=TOd9bY') }), mk('Post', 'Casa - Perequê', { note: '18h · COLLAB COM TODOS', link: L('IgBj2R42KoZ_SKYXJKnUb78TAUbZcBum8YN3MsWMuoHgIo4?e=R5rHhj') }) ],
    [ mk('Reels', 'Ilhabela é um lugar escasso', { note: '12h', link: L('IgB6jLBDN62tTLBPi258vU9HAeisjBsWLZRjzuI2ftL97HU?e=Oi4mJz') }), mk('Carrossel', 'Artigo Tinta Branca', { note: '15h' }), mk('Lançamento', 'Pra quem acha que é fácil (engenho branco)', { note: '18h', link: L('IgCqgLjqhNPEQKfNiGybGXy3AfMoi5X_8SHXE2DcqvQH4PA?e=vXNXL8'), legenda: legPra }) ],
    [ mk('Reels', '2009 recebi um representante', { note: '15h', link: L('IgCAzXfftWVNS5YTw20aEpYlAYAmfHEmvq8CL66IZSW_-zY?e=eHbCe2') }) ],
    [],
    [ mk('Reels', 'QUEM VEM PARA ILHABELA', { note: '15h', link: L('IgD9naC-m_T5SKXIYIrBh2ftATFOk88PEuYq1Q1NbBS5NyA?e=SLO2gP') }), mk('Lançamento', 'Spoiler + Takes', { note: '18h', link: L('IgC_CN9vx6FpQ5kjrMZDtLQoAZ4KT8_chDUrk_90bWsqK0g?e=j0DR1F'), legenda: legSpoiler }) ]
  ]},
  { start: '2026-07-13', days: [
    [ mk('Reels', 'Ilhabela não vai crescer', { note: '15h', link: L('IgCDMh5-xhD0RYlfdU6DukJKAdDrowZfM6rCtfqhjVcn41E?e=Ylhadu') }), mk('Lançamento', 'Parte 01 - Engenho Branco', { note: '18h', link: L('IgA6Fn4H0yltRL205N_LAmamAdYL80RM0XuZOHEEZyZqBJs?e=9DBDME'), legenda: legP1 }) ],
    [ mk('Lançamento', 'Parte 02 - Engenho Branco', { note: '18h', link: L('IgB_kaq7sO1hSr7f7WpZR93HAXYMkHt7AWAHR7x-aV_GknU?e=jzreQu'), legenda: legP2 }) ],
    [ mk('Reels', 'Muitos falam sobre a cessão possessória', { note: '15h', link: L('IgCVo_1G2Xz8SoYkQ5QlzvU2AT8UGJJqUkT7gWNg7HfP4oM?e=mYqRhN') }), mk('Lançamento', 'Parte 03 - Engenho Branco', { note: '18h', link: L('IgBMH_6bGeuCRqQG_YMsKwujAeLdBSTLofNt1o-X06rf8gg?e=2c5uih'), legenda: legP3 }) ],
    [ mk('Post', 'Artigo MARCO.', { note: '14h' }), mk('Lançamento', 'Carrossel animado com Tour (Engenho Branco)', { note: '17h' }), mk('Reels', 'Casa com Matrícula (Itaguassu)', { note: '18h' }) ],
    [],
    [],
    [ mk('Reels', 'Criativo: proprietário que está pensando em alugar...', { note: '15h (talvez)' }), mk('Reels', 'Time que gosta de ambiente fresco + casa (Cocaia Chacara)', { note: '18h' }) ]
  ]},
  { start: '2026-07-20', days: [
    [ mk('Carrossel', 'Artigo PF ou PJ: Patrimônio e Sucessão', { note: 'A definir' }) ],
    [],
    [ mk('Reels', 'Uma quarta qualquer', { note: '12h', link: L('IgD4aDpmEK-WSq1XNV2LAWb8AUqaI7RtI1rxjF4Z4hPRxPk?e=0nl4hg') }) ],
    [], [], [], []
  ]}
];

// ISO local a partir de start (segunda) + offset de dia.
const isoFromStart = (start, offset) => {
  const [y, m, d] = start.split('-').map(Number);
  const dt = new Date(y, m - 1, d + offset);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

// Lista achatada de posts { dateKey, type, title, note, link, linkLabel, legenda }.
export const OPA_POSTS = WEEKS.flatMap((w) =>
  w.days.flatMap((arr, i) => arr.map((p) => ({ ...p, dateKey: isoFromStart(w.start, i) })))
);

// Gavetas por imóvel.
const gv = (type, title, extra = {}) => ({ type, title, link: '', linkLabel: 'Ver materiais', legenda: '', ...extra });

export const OPA_GAVETAS = [
  { name: 'Cocaia (Chácara)', code: '', items: [
    gv('Pasta', 'Casa com Valor afetivo', { link: L('IgCquKX40bf_RbDXnXkNysjQAfgnnLv9xIfjPoPIeY15Rew?e=wC0l3s') }),
    gv('Pasta', 'Conheça a casa que é a cara de Ilhabela', { link: L('IgB-qp-OUVuBSb_ZlKf2nHtPASoFWomX3wG7xZtIROrpxSk?e=hZFk0p') }),
    gv('Pasta', 'Fala pra mim que essa casa não é uma delicia', { link: L('IgCMDgxNtXN_SKq_NHc5-zx0AZKZJkWkYzid6Cul-taIFoI?e=f9W4uk') }),
    gv('Pasta', 'Lugar Fresco 2', { link: L('IgCh4aKhjwRSTLJ_p2w19rGeAU3JpntiyhMPVjMFfkLe7PU?e=Z5CHRK') }),
    gv('Pasta', 'MEZANINO SOLTO (CTA COMENTÁRIO)', { link: L('IgD1YWQ_2oRdSYdfvJOA09ChARStvdv0SLMfNU3JlU4erCE?e=O2WpbW') }),
    gv('Pasta', 'Mostrando Gourmet', { link: L('IgDGu806eBYnS5xRE7xoT-sWAekVj2nhXIf4f5Mcffy1hjw?e=80B7h0') }),
    gv('Pasta', 'Olha a cara de chácara', { link: L('IgBPhOWaF4UvTprmfzNJoC3OAWcwd1gulsw12LeJSHLltOg?e=XL1rBy') }),
    gv('Pasta', 'Time que gosta de ambiente fresco + casa', { link: L('IgAm-GB7yrwYSrdy7arkJnG5AcqTX0VAADF_VD43CbtwBiw?e=SWblyb') })
  ]},
  { name: 'Casa Itaguassu', code: 'CA0328', items: [
    gv('Pasta', 'Casa com Matrícula', { link: L('IgBxQP1miDZeRZMGN1KYqpICAQcbQL6dtBV1dcIy8fgpQXA?e=6u4Uh1') }),
    gv('Pasta', 'Mostrando acesso', { link: L('IgArSDaVPobPQZ4-D30NL9xoASn7_TNiLVppylVbQtRtw1I?e=7FFpn6') })
  ]},
  { name: 'Engenho Branco', code: '', items: [
    gv('Lançamento', 'Você moraria... Engenho Branco', { link: L('IgD0I0Jd4v_LSrJgjZlrXADxAfbJf9XsKXgEI7UCVzMAB1g?e=QNvr9W'), legenda: legMoraria }),
    gv('Lançamento', 'Sempre me surpreendo... (engenho branco)', { link: L('IgCAoykqoMwdS46Oq_fZtlXVAWwhMroptxH0Km35XURWtZU?e=odTYA0'), legenda: legSurp }),
    gv('Lançamento', 'Eu to filmando aqui (engenho branco)', { link: L('IgCXejuoMOUHS7K0pvLV9IIVAfK4ql_cVg3ns8IkQE4-rl8?e=dlH5yS'), legenda: legFilm })
  ]}
];
