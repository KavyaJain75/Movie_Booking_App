import mongoose from "mongoose";
import Booking from "../models/Bookings.js"; // Notice singular 'Booking' vs plural 'Bookings'
import Movie from "../models/Movie.js";
import User from "../models/User.js";

export const newBooking = async (req, res, next) => {
  const { movie, date, seatNumber, user } = req.body;

  let existingMovie;
  let existingUser;
  try {
    existingMovie = await Movie.findById(movie);
    existingUser = await User.findById(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Error" });
  }

  if (!existingMovie) {
    return res.status(404).json({ message: "Movie Not Found With Given ID" });
  }

  if (!existingUser) {
    return res.status(404).json({ message: "User not found with given ID" });
  }

  let booking;

  try {
    booking = new Booking({
      movie,
      date: new Date(date),
      seatNumber,
      user,
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    existingUser.bookings.push(booking._id);
    existingMovie.bookings.push(booking._id);

    await existingUser.save({ session });
    await existingMovie.save({ session });
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Unable to create a booking" });
  }

  return res.status(201).json({ booking });
};

export const getBookingById = async (req, res, next) => {
  const id = req.params.id;
  let booking;
  try {
    booking = await Booking.findById(id);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Error" });
  }
  if (!booking) {
    return res.status(404).json({ message: "Booking Not Found" });
  }
  return res.status(200).json({ booking });
};

export const deleteBooking = async (req, res, next) => {
  const id = req.params.id;
  let booking;
  try {
    booking = await Booking.findByIdAndDelete(id).populate("user movie");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    booking.user.bookings.pull(booking._id);
    booking.movie.bookings.pull(booking._id);

    await booking.user.save({ session });
    await booking.movie.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to delete booking" });
  }

  return res.status(200).json({ message: "Successfully Deleted" });
};
