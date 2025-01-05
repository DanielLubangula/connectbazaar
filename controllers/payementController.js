// controllers/paymentController.js
 const Payment = require('../models/payement');

// Obtenir tous les paiements
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find();
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des paiements', error });
    }
};

// Rechercher des paiements par filtre
exports.searchPayments = async (req, res) => {
    const { name, email, date, status } = req.query;
    const filters = {};

    if (name) filters.name = new RegExp(name, 'i'); // Recherche insensible à la casse
    if (email) filters.email = new RegExp(email, 'i');
    if (date) filters.createdAt = { $gte: new Date(date), $lte: new Date(date + 'T23:59:59Z') };
    if (status) filters.status = status;
    console.log(filters)
    try {
        const payments = await Payment.find(filters);
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la recherche des paiements', error });
    }
};

// Mettre à jour le statut d'un paiement
exports.updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const payment = await Payment.findByIdAndUpdate(id, { status }, { new: true });
        if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut', error });
    }
};

// Ajouter une note à un paiement
exports.addNote = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    console.log("note", notes)

    try {
        const payment = await Payment.findById(id);
        if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });
        payment.notes = notes;
        await payment.save();
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'ajout de la note', error });
    }
};

// Exporter les paiements sous format CSV
exports.exportPayments = async (req, res) => {
    try {
        const payments = await Payment.find();
        const csvContent = [
            ['ID', 'Nom', 'Email', 'Montant', 'Date', 'Statut'].join(','),
            ...payments.map(p => [
                p._id,
                p.name,
                p.email,
                p.amount,
                p.createdAt.toISOString(),
                p.status
            ].join(','))
        ].join('\n');

        res.header('Content-Type', 'text/csv');
        res.attachment('paiements.csv');
        res.send(csvContent);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'exportation des paiements', error });
    }
};


// Endpoint pour les statistiques
exports.stats = async (req, res) => {
    try {
        // Récupérer tous les paiements
        const payments = await Payment.find();

        // Calculer les statistiques
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0); // Somme des montants
        const pendingPayments = payments.filter(p => p.status === 'pending').length; // Nombre de paiements en attente
        const approvedPayments = payments.filter(p => p.status === 'approved').length; // Nombre de paiements approuvés
        const approvalRate = payments.length > 0
            ? ((approvedPayments / payments.length) * 100).toFixed(2)
            : 0; // Taux d'approbation

        // Retourner les statistiques
        res.json({
            totalPayments,
            pendingPayments,
            approvalRate,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors du calcul des statistiques', error });
    }
};

 
// API pour récupérer les informations de paiement selon le numéro de téléphone
exports.getPaymentStatus = async (req, res) => {
  try {
      const { phone } = req.query; // Récupérer le numéro de téléphone depuis les paramètres de requête
       
    if (!phone) {
      return res.status(400).json({ message: 'Numéro de téléphone requis' });
    }

    // Rechercher les paiements associés à ce numéro de téléphone
    const payments = await Payment.find({ phone });
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Aucun paiement trouvé' });
    }

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
