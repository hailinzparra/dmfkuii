document.addEventListener('DOMContentLoaded', () => {
    const form = dom.q('#screening_form')! as HTMLFormElement
    const result_area = dom.q('#result_area')! as HTMLDivElement
    const current_year = new Date().getFullYear()

    const boolean_questions_data = [
        { id: 'preeclampsia', label: '13. Bengkak pada muka/tungkai dan tekanan darah tinggi', is_emergency: false },
        { id: 'twins', label: '14. Hamil kembar 2 atau lebih', is_emergency: false },
        { id: 'hydramnion', label: '15. Hamil kembar air (Hydramnion)', is_emergency: false },
        { id: 'stillbirth', label: '16. Bayi mati dalam kandungan', is_emergency: false },
        { id: 'breech', label: '17. Letak sungsang', is_emergency: true },
        { id: 'transverse', label: '18. Letak lintang', is_emergency: true },
        { id: 'bleeding', label: '19. Perdarahan dalam kehamilan ini', is_emergency: true },
        { id: 'severe_preeclampsia', label: '20. Preeklamsia berat/kejang-kejang', is_emergency: true },
    ]

    const warning_icon = ' <span class="text-danger-emphasis"><i class="fa-solid fa-circle-exclamation"></i></span>'

    const render_boolean_questions = () => {
        const container = dom.q('#boolean_questions')! as HTMLDivElement
        container.innerHTML = boolean_questions_data.map((q, i) => `
<div class="${i > 0 ? 'mt-3' : ''}">
    <label class="form-label">${q.label}${q.is_emergency ? warning_icon : ''}</label>
    <div>
        <input type="radio" class="btn-check" name="${q.id}" value="ya"
            id="${q.id}_ya" autocomplete="off">
        <label class="btn btn-outline-danger" for="${q.id}_ya">Ya</label>
        <input type="radio" class="btn-check" name="${q.id}" value="tidak"
            id="${q.id}_tidak" autocomplete="off" checked>
        <label class="btn btn-outline-success" for="${q.id}_tidak">Tidak</label>
    </div>
</div>`).join('')
    }

    render_boolean_questions()

    form.addEventListener('submit', e => {
        e.preventDefault()
        // calculate_risk_score()
    })
})
