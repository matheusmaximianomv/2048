let tabuleiro
let gameState = Object.freeze({
    'menu': 0,
    'informacoes': 1,
    'jogando': 2,
    'pausado': 3,
    'ganhou': 4,
    'perdeu': 5
})
let estadoAtual
let pontuacaoAtual
let maiorPontuacao
let movimento
let celulasLivres = []
let liberado = true
let intervaloDelay
let ganhou = false

const quantCelulas = 4

$(document).ready(() => {
    iniciarJogo()
})

// Quando pressionam alguma tecla do teclado
$(document).on('keydown', function (e) {
    if (estadoAtual == gameState.jogando && liberado) {
        switch (e.keyCode) {
            case 40:
                moverTilesBaixo(false)
                break
            case 38:
                moverTilesCima(false)
                break
            case 37:
                moverTilesEsquerda(false)
                break
            case 39:
                moverTilesDireita(false)
                break
        }
    }
})

$(document).swipeleft(() => {
    if (estadoAtual == gameState.jogando && liberado)
        moverTilesEsquerda(false)
})

$(document).swiperight(() => {
    if (estadoAtual == gameState.jogando && liberado)
        moverTilesDireita(false)
})

$(document).swipeup(() => {
    if (estadoAtual == gameState.jogando && liberado)
        moverTilesCima(false)
})

$(document).swipedown(() => {
    if (estadoAtual == gameState.jogando && liberado)
        moverTilesBaixo(false)
})

// Quando tela redimensionar atualiza o tamanho dos tiles
$(window).resize(() => {
    if (window.innerWidth < 700) {
        let elemento = $('.celula[data-linha=1][data-coluna=1]')
        let largura = elemento.width()
        let altura = elemento.height()
        let esquerdas = [], topos = []
        for (let i = 2; i <= quantCelulas; i++) {
            esquerdas.push($(`.celula[data-linha=1][data-coluna=${i}]`).position().left)
            topos.push($(`.celula[data-linha=${i}][data-coluna=1]`).position().top)
        }

        $('.tile').css('width', largura)
        $('.tile').css('height', altura)
        $('.tile').css('line-height', altura + 'px')

        for (let i = 2; i <= quantCelulas; i++) {
            $(`.tile[data-linha=${i}']`).css('top', topos[ i - 2 ])
            $(`.tile[data-coluna=${i}']`).css('left', esquerdas[ i - 2 ] + 5)
        }
    }
})

$('#recomecar, #restart').click(() => {
    $('#perdeu').fadeOut()

    localStorage.removeItem('tabuleiro')
    localStorage.removeItem('score')
    iniciarJogo()
})

$('#continuar').click(() => {
    $('#ganhou').fadeOut()

    estadoAtual = gameState.jogando
})

$('#novo').click(() => {
    $('#ganhou').fadeOut()

    localStorage.removeItem('tabuleiro')
    localStorage.removeItem('score')
    iniciarJogo()
})

$('#info').click(() => {
    estadoAtual = gameState.informacoes

    $('#informacao').css('display', 'block')

    $('#geral').transition({ opacity: 0 }, 600, 'ease', () => {
        $('#informacao').transition({ top: 0, opacity: 1 })
    })
})

$('.fechar').click(() => {
    estadoAtual = gameState.jogando

    $('#informacao').transition({ top: '1100px', opacity: 0 }, 600, 'ease', () => {
        $('#geral').transition({ opacity: 1 })
        $('#informacao').css('display', 'none')
    })
})

// Gera um novo tile
function gerarNovoTile () {
    while (true) {
        let index = Math.floor(Math.random() * (celulasLivres.length - 1 - 0 + 1))
        let referencia = celulasLivres[ index ]
        let linha = referencia.split(',')[ 0 ]
        let coluna = referencia.split(',')[ 1 ]

        let elemento = $(`.celula[data-linha=${linha}][data-coluna=${coluna}]`)

        if (elemento.attr('data-ocupado') == 'false') {
            let topo = elemento.position().top
            let esquerda = elemento.position().left

            if (coluna != 1) esquerda += 5

            let values = [ 2, 2, 2, 4 ]
            values.sort(function () {
                return .5 - Math.random()
            })

            let valor = values[ 0 ]
            let cor = getCor(valor)

            let tile = $('<div>', {
                class: 'tile',
                text: valor,
                css: {
                    top: topo,
                    left: esquerda,
                    width: elemento.width(),
                    height: elemento.height(),
                    lineHeight: `${elemento.height()}px`,
                    background: cor,
                    color: 'black',
                }
            })
            tile.attr({
                'data-numero': valor,
                'data-somado': false,
                'data-linha': linha,
                'data-coluna': coluna,
            })
            tile.hide()

            tile.appendTo($('#tabuleiro')).fadeIn(() => {
                // tile.addClass('animTiles')
            })

            elemento.attr('data-ocupado', true)

            tabuleiro[ linha ][ coluna ] = valor

            localStorage.tabuleiro = JSON.stringify(tabuleiro)
            // Remove celula livre 
            celulasLivres.splice(index, 1)

            break
        }
    }

    jogoAcabou()
    liberado = false
    setTimeout(function () {
        liberado = true
    }, 60)
}

// Verifica quais lihas já estão preenchidas
function verificarCelulasLivres () {
    let cont = 0

    for (let i = 1; i <= quantCelulas; i++) {
        for (let j = 1; j <= quantCelulas; j++) {
            if ($(`.celula[data-linha=${i}][data-coluna=${j}]`).attr('data-ocupado') == 'false') {
                celulasLivres[ cont ] = i + ',' + j
                cont++
            }
        }
    }
}

// Função para mover os tiles para baixo
function moverTilesBaixo (debug) {
    let novoTabuleiro = { '1': {}, '2': {}, '3': {}, '4': {} }
    let tilesMovidos = 0
    for (let i = 1; i <= quantCelulas; i++) {
        // Pegar valores da coluna
        let coluna = {}
        for (let j = 1; j <= quantCelulas; j++) {
            coluna[ j ] = tabuleiro[ j ][ i ]
        }

        for (let j = quantCelulas; j > 0; j--) {
            if (coluna[ j ] != 0) {
                if (j != quantCelulas) {
                    // Variavel que diz o que vai fazer com o tile
                    let fazer = 'nada'
                    // Variavel que diz para onde o tile deve ir
                    let linhaLivre
                    let teste = j + 1
                    while (teste <= quantCelulas) {
                        if (coluna[ teste ] == 0) {
                            fazer = 'mover'
                            linhaLivre = teste
                        } else if (coluna[ teste ] == coluna[ j ] && $(`.celula[data-linha=${teste}][data-coluna=${i}]`).attr('data-somado') == 'false') {
                            fazer = 'somar'
                            linhaLivre = teste
                        } else if (coluna[ teste ] != coluna[ j ] && coluna[ teste ] != 0) {
                            teste = 4
                        }
                        teste++
                        if (teste == 5 && !debug) {
                            if (fazer == 'mover') {
                                coluna[ linhaLivre ] = coluna[ j ]
                                coluna[ j ] = 0
                                $(`.tile[data-linha=${j}][data-coluna=${i}]`).attr('data-linha', linhaLivre)
                                $(`.celula[data-linha=${j}][data-coluna=${i}]`).attr('data-ocupado', false)
                                $(`.celula[data-linha=${linhaLivre}][data-coluna=${i}]`).attr('data-ocupado', true)
                                tilesMovidos++
                            } else if (fazer == 'somar') {
                                coluna[ linhaLivre ] *= 2
                                pontuar(coluna[ linhaLivre ])
                                coluna[ j ] = 0
                                $(`.celula[data-linha=${linhaLivre}][data-coluna=${i}]`).attr({
                                    'data-somado': true,
                                    'data-ocupado': true
                                })
                                $(`.celula[data-linha=${j}][data-coluna=${i}]`).attr('data-ocupado', false)
                                $(`.celula[data-linha=${linhaLivre}][data-coluna=${i}]`).attr('data-ocupado', true)
                                $(`.tile[data-linha=${j}][data-coluna=${i}]`).attr('data-linha', linhaLivre)

                                valor = $(`.tile[data-linha=${linhaLivre}][data-coluna=${i}]`).attr('data-numero')
                                $(`.tile[data-linha=${linhaLivre}][data-coluna=${i}]`).attr('data-numero', (valor * 2))
                                tilesMovidos++
                            }
                        }
                    }
                }
            }
        }

        novoTabuleiro[ 1 ][ i ] = coluna[ 1 ]
        novoTabuleiro[ 2 ][ i ] = coluna[ 2 ]
        novoTabuleiro[ 3 ][ i ] = coluna[ 3 ]
        novoTabuleiro[ 4 ][ i ] = coluna[ 4 ]
    }

    if (tilesMovidos > 0 && !debug) {
        tabuleiro = novoTabuleiro
        animTiles()
    }

    return tilesMovidos
}

// Função para mover os tiles para cima
function moverTilesCima (debug) {
    let novoTabuleiro = { '1': {}, '2': {}, '3': {}, '4': {} }
    let tilesMovidos = 0
    for (let i = 1; i <= quantCelulas; i++) {
        // Pegar valores da coluna
        let coluna = {}
        for (let j = 1; j <= quantCelulas; j++) {
            coluna[ j ] = tabuleiro[ j ][ i ]
        }

        for (let j = 1; j < 5; j++) {
            if (coluna[ j ] != 0) {
                if (j != 1) {
                    // Variavel que diz o que vai fazer com o tile
                    let fazer = 'nada'
                    // Variavel que diz para onde o tile deve ir
                    let linhaLivre
                    let teste = j - 1
                    while (teste >= 1) {
                        if (coluna[ teste ] == 0) {
                            fazer = 'mover'
                            linhaLivre = teste
                        } else if (coluna[ teste ] == coluna[ j ] && $(`.celula[data-linha=${teste}][data-coluna=${i}]`).attr('data-somado') == 'false') {
                            fazer = 'somar'
                            linhaLivre = teste
                        } else if (coluna[ teste ] != coluna[ j ] && coluna[ teste ] != 0) {
                            teste = 1
                        }
                        teste--
                        if (teste == 0 && !debug) {
                            if (fazer == 'mover') {
                                coluna[ linhaLivre ] = coluna[ j ]
                                coluna[ j ] = 0
                                $(`.tile[data-linha=${j}][data-coluna=${i}]`).attr('data-linha', linhaLivre)
                                $(`.celula[data-linha=${j}][data-coluna=${i}]`).attr('data-ocupado', false)
                                $(`.celula[data-linha=${linhaLivre}][data-coluna=${i}]`).attr('data-ocupado', true)
                                tilesMovidos++
                            } else if (fazer == 'somar') {
                                coluna[ linhaLivre ] *= 2
                                pontuar(coluna[ linhaLivre ])
                                coluna[ j ] = 0
                                $(`.celula[data-linha=${linhaLivre}][data-coluna=${i}]`).attr('data-somado', true)
                                $(`.celula[data-linha=${j}][data-coluna=${i}]`).attr('data-ocupado', false)
                                $(`.celula[data-linha=${linhaLivre}][data-coluna=${i}]`).attr('data-ocupado', true)
                                $(`.tile[data-linha=${j}][data-coluna=${i}]`).attr('data-linha', linhaLivre)

                                valor = $(`.tile[data-linha=${linhaLivre}][data-coluna=${i}]`).attr('data-numero')
                                $(`.tile[data-linha=${linhaLivre}][data-coluna=${i}]`).attr('data-numero', (valor * 2))
                                tilesMovidos++
                            }
                        }
                    }
                }
            }
        }

        novoTabuleiro[ 1 ][ i ] = coluna[ 1 ]
        novoTabuleiro[ 2 ][ i ] = coluna[ 2 ]
        novoTabuleiro[ 3 ][ i ] = coluna[ 3 ]
        novoTabuleiro[ 4 ][ i ] = coluna[ 4 ]
    }

    if (tilesMovidos > 0 && !debug) {
        tabuleiro = novoTabuleiro
        animTiles()
    }

    return tilesMovidos
}

// Função para mover os tiles para esquerda
function moverTilesEsquerda (debug) {
    let novoTabuleiro = { '1': {}, '2': {}, '3': {}, '4': {} }
    let tilesMovidos = 0
    for (let i = 1; i <= quantCelulas; i++) {
        // Pegar valores da coluna
        let linha = {}
        for (let j = 1; j <= quantCelulas; j++) {
            linha[ j ] = tabuleiro[ i ][ j ]
        }

        for (let j = 1; j < 5; j++) {
            if (linha[ j ] != 0) {
                if (j != 1) {
                    // Variavel que diz o que vai fazer com o tile
                    let fazer = 'nada'
                    // Variavel que diz para onde o tile deve ir
                    let colunaLivre
                    let teste = j - 1
                    while (teste >= 1) {
                        if (linha[ teste ] == 0) {
                            fazer = 'mover'
                            colunaLivre = teste
                        } else if (linha[ teste ] == linha[ j ] && $(`.celula[data-linha=${i}][data-coluna=${teste}]`).attr('data-somado') == 'false') {
                            fazer = 'somar'
                            colunaLivre = teste
                        } else if (linha[ teste ] != linha[ j ] && linha[ teste ] != 0) {
                            teste = 1
                        }
                        teste--
                        if (teste == 0 && !debug) {
                            if (fazer == 'mover') {
                                linha[ colunaLivre ] = linha[ j ]
                                linha[ j ] = 0
                                $(`.tile[data-linha=${i}][data-coluna=${j}]`).attr('data-coluna', colunaLivre)
                                $(`.celula[data-linha=${i}][data-coluna=${j}]`).attr('data-ocupado', false)
                                $(`.celula[data-linha=${i}][data-coluna=${colunaLivre}]`).attr('data-ocupado', true)
                                tilesMovidos++
                            } else if (fazer == 'somar') {
                                linha[ colunaLivre ] *= 2
                                pontuar(linha[ colunaLivre ])
                                linha[ j ] = 0
                                $(`.celula[data-linha=${i}][data-coluna=${colunaLivre}]`).attr('data-somado', true)
                                $(`.celula[data-linha=${i}][data-coluna=${j}]`).attr('data-ocupado', false)
                                $(`.celula[data-linha=${i}][data-coluna=${colunaLivre}]`).attr('data-ocupado', true)
                                $(`.tile[data-linha=${i}][data-coluna=${j}]`).attr('data-coluna', colunaLivre)

                                valor = $(`.tile[data-linha=${i}][data-coluna=${colunaLivre}]`).attr('data-numero')
                                $(`.tile[data-linha=${i}][data-coluna=${colunaLivre}]`).attr('data-numero', (valor * 2))
                                tilesMovidos++
                            }
                        }
                    }
                }
            }
        }

        novoTabuleiro[ i ][ 1 ] = linha[ 1 ]
        novoTabuleiro[ i ][ 2 ] = linha[ 2 ]
        novoTabuleiro[ i ][ 3 ] = linha[ 3 ]
        novoTabuleiro[ i ][ 4 ] = linha[ 4 ]
    }

    if (tilesMovidos > 0 && !debug) {
        tabuleiro = novoTabuleiro
        animTiles()
    }

    return tilesMovidos
}

// Função para mover os tiles para direita
function moverTilesDireita (debug) {
    let novoTabuleiro = { '1': {}, '2': {}, '3': {}, '4': {} }
    let tilesMovidos = 0
    for (let i = 1; i <= quantCelulas; i++) {
        // Pegar valores da coluna
        let linha = {}
        for (let j = 1; j <= quantCelulas; j++) {
            linha[ j ] = tabuleiro[ i ][ j ]
        }

        for (let j = 4; j > 0; j--) {
            if (linha[ j ] != 0) {
                if (j != 4) {
                    // Variavel que diz o que vai fazer com o tile
                    let fazer = 'nada'
                    // Variavel que diz para onde o tile deve ir
                    let colunaLivre
                    let teste = j + 1
                    while (teste <= quantCelulas) {
                        if (linha[ teste ] == 0) {
                            fazer = 'mover'
                            colunaLivre = teste
                        } else if (linha[ teste ] == linha[ j ] && $(`.celula[data-linha=${i}][data-coluna=${teste}]`).attr('data-somado') == 'false') {
                            fazer = 'somar'
                            colunaLivre = teste
                        } else if (linha[ teste ] != linha[ j ] && linha[ teste ] != 0) {
                            teste = 4
                        }
                        teste++
                        if (teste == 5 && !debug) {
                            if (fazer == 'mover') {
                                linha[ colunaLivre ] = linha[ j ]
                                linha[ j ] = 0
                                $(`.tile[data-linha=${i}][data-coluna=${j}]`).attr('data-coluna', colunaLivre)
                                $(`.celula[data-linha=${i}][data-coluna=${j}]`).attr('data-ocupado', false)
                                $(`.celula[data-linha=${i}][data-coluna=${colunaLivre}]`).attr('data-ocupado', true)
                                tilesMovidos++
                            } else if (fazer == 'somar') {
                                linha[ colunaLivre ] *= 2
                                pontuar(linha[ colunaLivre ])
                                linha[ j ] = 0
                                $(`.celula[data-linha=${i}][data-coluna=${colunaLivre}]`).attr('data-somado', true)
                                $(`.celula[data-linha=${i}][data-coluna=${j}]`).attr('data-ocupado', false)
                                $(`.celula[data-linha=${i}][data-coluna=${colunaLivre}]`).attr('data-ocupado', true)
                                $(`.tile[data-linha=${i}][data-coluna=${j}]`).attr('data-coluna', colunaLivre)

                                valor = $(`.tile[data-linha=${i}][data-coluna=${colunaLivre}]`).attr('data-numero')
                                $(`.tile[data-linha=${i}][data-coluna=${colunaLivre}]`).attr('data-numero', (valor * 2))
                                tilesMovidos++
                            }
                        }
                    }
                }
            }
        }

        novoTabuleiro[ i ][ 1 ] = linha[ 1 ]
        novoTabuleiro[ i ][ 2 ] = linha[ 2 ]
        novoTabuleiro[ i ][ 3 ] = linha[ 3 ]
        novoTabuleiro[ i ][ 4 ] = linha[ 4 ]
    }

    if (tilesMovidos > 0 && !debug) {
        tabuleiro = novoTabuleiro
        animTiles()
    }

    return tilesMovidos
}

// Função para fazer a animação dos Tiles
function animTiles () {
    apagar = [ 0, 0 ]
    $('.tile').each(function () {
        linha = $(this).attr('data-linha')
        coluna = $(this).attr('data-coluna')

        elemento = $(`.celula[data-linha=${linha}][data-coluna=${coluna}]`)
        topo = elemento.position().top
        esquerda = elemento.position().left
        altura = elemento.height()

        if (coluna != 1) esquerda += 5
        valor = $(this).attr('data-numero')
        $(this).text(valor)
        cor = getCor(valor)
        letra = (valor > 4) ? 'white' : 'black'
        shadow = (valor > 4) ? '1px 1px 1px rgba(0, 0, 0, 0.54902)' : 'none'

        $(this).transition({
            top: topo,
            left: esquerda,
            background: cor,
            color: letra,
            textShadow: shadow
        }, 300, 'ease', () => {
            // $(this).addClass('animTiles')
        })

    })
    $('.celula').attr('data-somado', false)
    verificarCelulasLivres()
    setTimeout(function () {
        gerarNovoTile()
        removerTilesRepetidos()
        $('.tile').removeClass('animTiles')
    }, 300)
}

// Função para remover tiles repetidos
function removerTilesRepetidos () {
    let jaTem = []
    $('.tile').each(function () {
        linha = $(this).attr('data-linha')
        coluna = $(this).attr('data-coluna')

        if ($(`.tile[data-linha=${linha}][data-coluna=${coluna}]`).length > 1) {
            if (jaTem.indexOf(linha + ',' + coluna) != -1) {
                $(this).remove()
            } else {
                jaTem.push(linha + ',' + coluna)
            }
        }
    })
}

// Função para retorna a cor correspondente ao valor
function getCor (valor) {
    let cores = {
        '2': '#EEE4DA',
        '4': '#ECE0C8',
        '8': '#F2B179',
        '16': '#F69461',
        '32': '#EB775B',
        '64': '#F65D3B',
        '128': '#F2E2B1',
        '256': '#ECCC61',
        '512': '#ECC84E',
        '1024': '#EDC53F',
        '2048': '#FBC52D',
        '4096': '#F46674',
        '8192': '#F34A5D',
        '16384': '#E9403B',
        '32768': '#9ecfff',
        '65536': '#5CA0E7',
        '131072': '#007FC6',
    }

    return cores[ valor ]
}

// Função para pontuar
function pontuar (pontos) {
    pontuacaoAtual += pontos
    $('#pontuacaoAtual h4').text(pontuacaoAtual)

    if (pontuacaoAtual > maiorPontuacao) {
        maiorPontuacao = pontuacaoAtual
        $('#maiorPontuacao h4').text(pontuacaoAtual)
        localStorage.best = pontuacaoAtual
    }

    localStorage.score = pontuacaoAtual

    if (pontos == 2048 && !ganhou) {
        $('#ganhou').fadeIn()
        estadoAtual = gameState.ganhou
        ganhou = true
    }
}

// Função para verificar se o jogo acabou
function jogoAcabou () {
    if (celulasLivres.length == 0 && movimentosPossiveis()) {
        estadoAtual = gameState.perdeu
        $('#perdeu').fadeIn()

        localStorage.removeItem('tabuleiro')
        localStorage.removeItem('score')
    }
}

// Função para carregarJogoSalvo

function iniciarJogo () {
    estadoAtual = gameState.jogando
    pontuacaoAtual = (typeof localStorage.score != 'undefined') ? parseInt(localStorage.score) : 0
    maiorPontuacao = (typeof localStorage.best != 'undefined') ? parseInt(localStorage.best) : 0
    tabuleiro = (typeof localStorage.tabuleiro != 'undefined') ? JSON.parse(localStorage.tabuleiro) : 0

    $('#pontuacaoAtual h4').text(pontuacaoAtual)
    $('#maiorPontuacao h4').text(maiorPontuacao)
    console.log(tabuleiro)
    if (tabuleiro == 0) {
        $('.tile').remove()
        $('.celula').attr('data-ocupado', false)
        tabuleiro = { '1': {}, '2': {}, '3': {}, '4': {} }
        cont = 0
        celulasLivres = []
        for (let i = 1; i < 5; i++) {
            for (let j = 1; j < 5; j++) {
                celulasLivres[ cont ] = i + ',' + j
                cont++
                tabuleiro[ i ][ j ] = 0
            }
        }
        gerarNovoTile()
    } else {
        for (let i = 1; i < 5; i++) {
            for (let j = 1; j < 5; j++) {
                if (tabuleiro[ i ][ j ] != 0) {
                    let elemento = $(`.celula[data-linha=${i}][data-coluna=${j}]`)

                    let topo = elemento.position().top
                    let esquerda = elemento.position().left

                    if (j != 1) esquerda += 5

                    let valor = tabuleiro[ i ][ j ]
                    let cor = getCor(valor)
                    let letra = (valor > 4) ? 'white' : 'black'
                    let shadow = (valor > 4) ? '1px 1px 1px rgba(0, 0, 0, 0.54902)' : ''

                    let tile = $("<div>", {
                        class: 'tile',
                        css: {
                            top: topo,
                            left: esquerda,
                            width: elemento.width(),
                            height: elemento.height(),
                            lineHeight: elemento.height() + 'px',
                            background: cor,
                            color: letra,
                            textShadow: shadow,
                        },
                        text: valor,
                    })
                    tile.attr({
                        "data-numero": valor,
                        "data-somado": false,
                        "data-linha": i,
                        "data-coluna": j,
                    })

                    console.log(tile)
                    $('#tabuleiro').append(tile)

                    elemento.attr("data-ocupado", "true")

                    $('.tile[data-linha=' + i + '][data-coluna=' + j + ']').animate({ opacity: 1 }, 50)


                }
            }
        }
        verificarCelulasLivres()
    }

    $('.celula').attr('data-somado', false)
    jogoAcabou()
}

// Função para verivicar se ainda podem ser feitos movimentos
function movimentosPossiveis () {
    teste = true
    for (let i = 1; i <= quantCelulas; i++) {
        for (let j = 1; j <= quantCelulas; j++) {
            let valor = $('.tile[data-linha=' + i + '][data-coluna=' + j + ']').attr('data-numero')
            let outroValor = $('.tile[data-linha=' + (i + 1) + '][data-coluna=' + (j) + ']').attr('data-numero')
            if (valor == outroValor) teste = false
            outroValor = $('.tile[data-linha=' + (i - 1) + '][data-coluna=' + (j) + ']').attr('data-numero')
            if (valor == outroValor) teste = false
            outroValor = $('.tile[data-linha=' + (i) + '][data-coluna=' + (j + 1) + ']').attr('data-numero')
            if (valor == outroValor) teste = false
            outroValor = $('.tile[data-linha=' + (i) + '][data-coluna=' + (j - 1) + ']').attr('data-numero')
            if (valor == outroValor) teste = false

            if (!teste) break
        }
        if (!teste) break
    }

    return teste
}