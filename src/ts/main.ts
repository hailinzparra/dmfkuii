const main: {
    db: {
        ref(path?: string): FirebaseDatabase
    },
    init_bs_tooltip(): void,
} = {
    db: {
        ref(path) {
            if (path) {
                path = path.replaceAll('.', '')
                    .replaceAll('#', '')
                    .replaceAll('$', '')
                    .replaceAll('[', '')
                    .replaceAll(']', '')
            }
            return firebase.database().ref(path)
        }
    },
    init_bs_tooltip() {
        dom.qa('.tooltip').forEach(n => n.remove())
        dom.qa('[data-bs-toggle="tooltip"]').forEach(n => new bootstrap.Tooltip(n))
    },
}
